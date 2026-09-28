import { randomUUID } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Difficulty, Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthSecret } from "@/lib/auth-secret";
import { generateQuestions } from "@/lib/ai/question-generator";
import { httpError, parseJson } from "@/lib/utils";
import type { QuestionOption } from "@/types";

export const PRACTICE_COOKIE = "examly_practice";
export const PRACTICE_MIN_QUESTIONS = 5;
export const PRACTICE_MAX_QUESTIONS = 30;
const PRACTICE_TTL_MS = 30 * 60 * 1000;

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

export const practiceStartSchema = z
  .object({
    classId: z.string().min(1),
    subjectKey: z.string().max(80).optional().default(""),
    topicKey: z.string().max(80).optional().default(""),
    difficulty: z.enum(["ANY", "EASY", "MEDIUM", "HARD"]).default("ANY"),
    count: z.number().int().min(PRACTICE_MIN_QUESTIONS).max(PRACTICE_MAX_QUESTIONS),
    source: z.enum(["BANK", "AI"]),
  })
  .strict();

export const practiceAvailabilitySchema = z
  .object({
    classId: z.string().min(1),
    subjectKey: z.string().max(80).optional().default(""),
    topicKey: z.string().max(80).optional().default(""),
    difficulty: z.enum(["ANY", "EASY", "MEDIUM", "HARD"]).default("ANY"),
  })
  .strict();

export const practiceCheckSchema = z
  .object({
    questionId: z.string().min(1),
    selectedAnswer: z.enum(OPTION_KEYS),
  })
  .strict();

export type PracticeStartInput = z.infer<typeof practiceStartSchema>;

export type PublicPracticeQuestion = {
  id: string;
  questionText: string;
  options: QuestionOption[];
};

export type PracticeCheckResult = {
  questionId: string;
  selectedAnswer: string;
  correct: boolean;
  correctAnswer: string;
  explanation: string | null;
};

export type PublicPracticeSession = {
  source: "BANK" | "AI";
  className: string;
  subject: string | null;
  topic: string | null;
  difficulty: string | null;
  questions: PublicPracticeQuestion[];
  results: Record<string, PracticeCheckResult>;
  complete: boolean;
};

export type PracticeSetupClass = {
  id: string;
  name: string;
  subject: string;
  subjects: Array<{ key: string; label: string }>;
  topicsBySubject: Record<string, Array<{ key: string; label: string }>>;
};

type PracticeClass = {
  id: string;
  name: string;
  subject: string;
  institutionId: string;
  syllabuses: Array<{
    id: string;
    content?: string;
    createdAt: Date;
    topics: Array<{ id: string; name: string; parentTopicId: string | null }>;
  }>;
  subjects: Array<{
    subject: {
      id: string;
      name: string;
      units: Array<{ topics: Array<{ id: string; name: string }> }>;
    };
  }>;
};

type StoredQuestion = PublicPracticeQuestion & {
  correctAnswer: string;
  explanation: string | null;
  topicLabel: string | null;
};

type StoredSession = {
  studentId: string;
  source: "BANK" | "AI";
  classId: string;
  className: string;
  subject: string | null;
  topic: string | null;
  difficulty: string | null;
  questions: StoredQuestion[];
  results: Record<string, PracticeCheckResult>;
  expiresAt: number;
};

type GlobalPracticeStore = typeof globalThis & {
  __examlyPracticeSessions?: Map<string, StoredSession>;
};

function sessionStore() {
  const g = globalThis as GlobalPracticeStore;
  if (!g.__examlyPracticeSessions) g.__examlyPracticeSessions = new Map();
  return g.__examlyPracticeSessions;
}

function pruneExpired() {
  const now = Date.now();
  const store = sessionStore();
  for (const [id, session] of store) {
    if (session.expiresAt <= now) store.delete(id);
  }
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalizeOptions(raw: unknown): QuestionOption[] {
  const parsed = parseJson<QuestionOption[]>(raw, Array.isArray(raw) ? (raw as QuestionOption[]) : []);
  const byKey = new Map(parsed.map((option) => [option.key, option.text]));
  return OPTION_KEYS.map((key) => ({ key, text: String(byKey.get(key) ?? "").trim() })).filter((option) => option.text.length > 0);
}

function toPublic(session: StoredSession): PublicPracticeSession {
  return {
    source: session.source,
    className: session.className,
    subject: session.subject,
    topic: session.topic,
    difficulty: session.difficulty,
    questions: session.questions.map((question) => ({
      id: question.id,
      questionText: question.questionText,
      options: question.options,
    })),
    results: session.results,
    complete: Object.keys(session.results).length === session.questions.length,
  };
}

function isAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

async function setPracticeCookie(sid: string, studentId: string) {
  const token = await new SignJWT({ sid, studentId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30m")
    .sign(getAuthSecret());
  const store = await cookies();
  store.set(PRACTICE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 30,
  });
}

async function readPracticeToken(): Promise<{ sid: string; studentId: string } | null> {
  const store = await cookies();
  const token = store.get(PRACTICE_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    const sid = typeof payload.sid === "string" ? payload.sid : "";
    const studentId = typeof payload.studentId === "string" ? payload.studentId : "";
    if (!sid || !studentId) return null;
    return { sid, studentId };
  } catch {
    return null;
  }
}

async function requireEnrollment(studentId: string, classId: string) {
  const enrollment = await db.classStudent.findUnique({
    where: { classId_studentId: { classId, studentId } },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          subject: true,
          institutionId: true,
          syllabuses: {
            select: {
              id: true,
              content: true,
              createdAt: true,
              topics: { select: { id: true, name: true, parentTopicId: true } },
            },
            orderBy: { createdAt: "desc" },
          },
          subjects: {
            include: {
              subject: {
                select: {
                  id: true,
                  name: true,
                  units: {
                    orderBy: { order: "asc" },
                    select: {
                      topics: { orderBy: { order: "asc" }, select: { id: true, name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!enrollment) throw httpError("You are not enrolled in this class.", 403);
  return enrollment.class;
}

function classSubjectOptions(cls: PracticeClass) {
  const subjects: Array<{ key: string; label: string }> = [{ key: "class", label: cls.subject }];
  for (const link of cls.subjects) {
    if (link.subject.name === cls.subject) continue;
    subjects.push({ key: `lib:${link.subject.id}`, label: link.subject.name });
  }
  const syllabusTopics = cls.syllabuses.flatMap((syllabus) =>
    syllabus.topics.map((topic) => ({ key: `st:${topic.id}`, label: topic.name })),
  );
  const topicsBySubject: Record<string, Array<{ key: string; label: string }>> = {
    class: uniqueTopics(syllabusTopics),
  };
  for (const link of cls.subjects) {
    const key = `lib:${link.subject.id}`;
    topicsBySubject[key] = uniqueTopics(
      link.subject.units.flatMap((unit) =>
        unit.topics.map((topic) => ({ key: `su:${topic.id}`, label: topic.name })),
      ),
    );
  }
  return { subjects, topicsBySubject };
}

function uniqueTopics(topics: Array<{ key: string; label: string }>) {
  const seen = new Set<string>();
  return topics.filter((topic) => {
    const id = `${topic.key}:${topic.label.toLowerCase()}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function resolveSubject(cls: PracticeClass, subjectKey: string) {
  if (!subjectKey || subjectKey === "class") {
    return { label: cls.subject, librarySubjectId: null as string | null };
  }
  if (subjectKey.startsWith("lib:")) {
    const subjectId = subjectKey.slice(4);
    const link = cls.subjects.find((row) => row.subject.id === subjectId);
    if (!link) throw httpError("That subject is not part of this class.", 400);
    return { label: link.subject.name, librarySubjectId: subjectId };
  }
  throw httpError("Invalid subject selection.", 400);
}

function resolveTopic(cls: PracticeClass, topicKey: string, librarySubjectId: string | null) {
  if (!topicKey) return { label: null as string | null, syllabusTopicId: null as string | null, subjectTopicName: null as string | null };
  if (topicKey.startsWith("st:")) {
    const topicId = topicKey.slice(3);
    const topic = cls.syllabuses.flatMap((syllabus) => syllabus.topics).find((row) => row.id === topicId);
    if (!topic) throw httpError("That topic is not available for this class.", 400);
    if (librarySubjectId) throw httpError("That topic does not belong to the selected subject.", 400);
    return { label: topic.name, syllabusTopicId: topic.id, subjectTopicName: null };
  }
  if (topicKey.startsWith("su:")) {
    const topicId = topicKey.slice(3);
    for (const link of cls.subjects) {
      if (librarySubjectId && link.subject.id !== librarySubjectId) continue;
      for (const unit of link.subject.units) {
        const topic = unit.topics.find((row) => row.id === topicId);
        if (topic) return { label: topic.name, syllabusTopicId: null, subjectTopicName: topic.name };
      }
    }
    throw httpError("That topic is not available for this class.", 400);
  }
  throw httpError("Invalid topic selection.", 400);
}

function libraryTopicNames(cls: PracticeClass, subjectId: string) {
  const link = cls.subjects.find((row) => row.subject.id === subjectId);
  if (!link) return [];
  return link.subject.units.flatMap((unit) => unit.topics.map((topic) => topic.name));
}

async function persistSession(studentId: string, session: Omit<StoredSession, "studentId" | "expiresAt" | "results">) {
  pruneExpired();
  const sid = randomUUID();
  sessionStore().set(sid, {
    ...session,
    studentId,
    results: {},
    expiresAt: Date.now() + PRACTICE_TTL_MS,
  });
  await setPracticeCookie(sid, studentId);
  return toPublic(sessionStore().get(sid)!);
}

async function loadOwnedSession(studentId: string) {
  pruneExpired();
  const token = await readPracticeToken();
  if (!token) throw httpError("Your practice session has expired. Start a new practice quiz.", 404);
  if (token.studentId !== studentId) throw httpError("Forbidden", 403);
  const session = sessionStore().get(token.sid);
  if (!session || session.studentId !== studentId) {
    throw httpError("Your practice session has expired. Start a new practice quiz.", 404);
  }
  if (session.expiresAt <= Date.now()) {
    sessionStore().delete(token.sid);
    throw httpError("Your practice session has expired. Start a new practice quiz.", 404);
  }
  return session;
}

function bankWhere(
  classId: string,
  difficulty: PracticeStartInput["difficulty"],
  topic: ReturnType<typeof resolveTopic>,
  librarySubjectId: string | null,
  cls: PracticeClass,
): Prisma.QuestionWhereInput {
  const where: Prisma.QuestionWhereInput = {
    classId,
    tests: { none: {} },
  };
  if (difficulty !== "ANY") where.difficulty = difficulty as Difficulty;
  if (topic.syllabusTopicId) {
    where.topicId = topic.syllabusTopicId;
    return where;
  }
  if (topic.subjectTopicName) {
    where.OR = [
      { topic: { name: topic.subjectTopicName } },
      { subtopic: topic.subjectTopicName },
    ];
    return where;
  }
  if (librarySubjectId) {
    const names = libraryTopicNames(cls, librarySubjectId);
    if (names.length) {
      where.OR = [{ topic: { name: { in: names } } }, { subtopic: { in: names } }];
    }
  }
  return where;
}

async function startBank(
  studentId: string,
  input: PracticeStartInput,
  cls: PracticeClass,
  subject: ReturnType<typeof resolveSubject>,
  topic: ReturnType<typeof resolveTopic>,
) {
  const where = bankWhere(cls.id, input.difficulty, topic, subject.librarySubjectId, cls);
  const available = await db.question.count({ where });
  if (available < PRACTICE_MIN_QUESTIONS || available < input.count) {
    throw httpError(
      `Only ${available} unused questions are available for this selection. Try another topic or difficulty.`,
      400,
    );
  }
  const pool = await db.question.findMany({
    where,
    select: { id: true, usageCount: true },
    orderBy: { usageCount: "asc" },
    take: 200,
  });
  if (pool.length < input.count) {
    throw httpError(
      `Only ${pool.length} unused questions are available for this selection. Try another topic or difficulty.`,
      400,
    );
  }
  const pickedIds = shuffle(pool).slice(0, input.count).map((row) => row.id);
  const rows = await db.question.findMany({
    where: { id: { in: pickedIds }, classId: cls.id, tests: { none: {} } },
  });
  if (rows.length !== input.count) {
    throw httpError("Could not load practice questions for this class. Please try again.", 400);
  }
  const byId = new Map(rows.map((row) => [row.id, row]));
  const questions: StoredQuestion[] = [];
  for (const id of pickedIds) {
    const row = byId.get(id);
    if (!row) continue;
    const options = normalizeOptions(row.optionsJson);
    if (options.length !== 4 || !OPTION_KEYS.includes(row.correctAnswer as (typeof OPTION_KEYS)[number])) {
      continue;
    }
    questions.push({
      id: row.id,
      questionText: row.questionText,
      options,
      correctAnswer: row.correctAnswer,
      explanation: row.explanation,
      topicLabel: topic.label,
    });
  }
  if (questions.length !== input.count) {
    throw httpError("Some bank questions are missing options. Try a different selection.", 400);
  }
  return persistSession(studentId, {
    source: "BANK",
    classId: cls.id,
    className: cls.name,
    subject: subject.label,
    topic: topic.label,
    difficulty: input.difficulty === "ANY" ? null : input.difficulty,
    questions: shuffle(questions),
  });
}

async function startAi(
  studentId: string,
  input: PracticeStartInput,
  cls: PracticeClass,
  subject: ReturnType<typeof resolveSubject>,
  topic: ReturnType<typeof resolveTopic>,
) {
  if (!isAiConfigured()) {
    throw httpError("AI Quiz is currently unavailable. Please try Question Bank practice.", 503);
  }
  const syllabus = cls.syllabuses[0];
  const topics = topic.label
    ? [topic.label]
    : subject.librarySubjectId
      ? libraryTopicNames(cls, subject.librarySubjectId)
      : syllabus?.topics.map((row) => row.name).filter(Boolean) ?? [];
  const drafts = await generateQuestions({
    syllabusText: syllabus?.content,
    topics: topics.length ? topics : [subject.label],
    count: input.count,
    difficulty: input.difficulty === "ANY" ? undefined : (input.difficulty as Difficulty),
  });
  const questions: StoredQuestion[] = drafts.map((draft) => ({
    id: randomUUID(),
    questionText: draft.questionText,
    options: draft.options,
    correctAnswer: draft.correctAnswer,
    explanation: draft.explanation,
    topicLabel: draft.topicName ?? topic.label,
  }));
  await db.aiUsage.create({
    data: {
      institutionId: cls.institutionId,
      kind: "QUESTION_GENERATION",
      questionsGenerated: questions.length,
    },
  });
  return persistSession(studentId, {
    source: "AI",
    classId: cls.id,
    className: cls.name,
    subject: subject.label,
    topic: topic.label,
    difficulty: input.difficulty === "ANY" ? null : input.difficulty,
    questions,
  });
}

export const practiceService = {
  aiAvailable() {
    return isAiConfigured();
  },

  async setupForStudent(studentId: string): Promise<PracticeSetupClass[]> {
    const enrollments = await db.classStudent.findMany({
      where: { studentId },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
            institutionId: true,
            syllabuses: {
              select: {
                id: true,
                createdAt: true,
                topics: { select: { id: true, name: true, parentTopicId: true } },
              },
              orderBy: { createdAt: "desc" },
            },
            subjects: {
              include: {
                subject: {
                  select: {
                    id: true,
                    name: true,
                    units: {
                      orderBy: { order: "asc" },
                      select: {
                        topics: { orderBy: { order: "asc" }, select: { id: true, name: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });
    return enrollments.map((row) => {
      const { subjects, topicsBySubject } = classSubjectOptions(row.class);
      return {
        id: row.class.id,
        name: row.class.name,
        subject: row.class.subject,
        subjects,
        topicsBySubject,
      };
    });
  },

  async availableBankCount(studentId: string, raw: unknown) {
    const input = practiceAvailabilitySchema.parse(raw);
    const cls = await requireEnrollment(studentId, input.classId);
    const subject = resolveSubject(cls, input.subjectKey);
    const topic = resolveTopic(cls, input.topicKey, subject.librarySubjectId);
    const where = bankWhere(cls.id, input.difficulty, topic, subject.librarySubjectId, cls);
    return db.question.count({ where });
  },

  async start(studentId: string, raw: unknown) {
    const input = practiceStartSchema.parse(raw);
    const cls = await requireEnrollment(studentId, input.classId);
    const subject = resolveSubject(cls, input.subjectKey);
    const topic = resolveTopic(cls, input.topicKey, subject.librarySubjectId);
    if (input.source === "BANK") return startBank(studentId, input, cls, subject, topic);
    return startAi(studentId, input, cls, subject, topic);
  },

  async getSession(studentId: string) {
    return toPublic(await loadOwnedSession(studentId));
  },

  async check(studentId: string, raw: unknown) {
    const input = practiceCheckSchema.parse(raw);
    const session = await loadOwnedSession(studentId);
    const existing = session.results[input.questionId];
    if (existing) return existing;
    const question = session.questions.find((row) => row.id === input.questionId);
    if (!question) throw httpError("That practice question is not part of this session.", 400);
    const selected = question.options.find((option) => option.key === input.selectedAnswer);
    if (!selected) throw httpError("Choose one of the listed options.", 400);
    const result: PracticeCheckResult = {
      questionId: question.id,
      selectedAnswer: input.selectedAnswer,
      correct: input.selectedAnswer === question.correctAnswer,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    };
    session.results[question.id] = result;
    return result;
  },
};
