import { attemptRemaining } from "@/lib/attempt-deadline";
import { db } from "@/lib/db";
import { examStatusFromWindow, examWindow, validateSchedule } from "@/lib/exam-window";
import { paperLabel, shuffle } from "@/lib/shuffle";
import { questionService } from "@/services/question.service";
import { notificationService } from "@/services/notification.service";
import { resultService } from "@/services/result.service";
import type { Prisma } from "@prisma/client";
import type { QuestionOption } from "@/types";

function optionKeys(question: { optionsJson: Prisma.JsonValue }) {
  const options = question.optionsJson as QuestionOption[];
  return options.map((option) => option.key);
}

export const examService = {
  async list(institutionId?: string | null) {
    await this.syncWindows(institutionId);
    return db.test.findMany({
      where: institutionId ? { institutionId } : undefined,
      include: {
        class: true,
        institution: true,
        _count: { select: { assignments: true, attempts: true, papers: true } },
        assignments: { select: { status: true } },
        attempts: { select: { status: true, percentage: true } },
      },
      orderBy: [{ startAt: "asc" }, { createdAt: "desc" }],
    });
  },

  get(id: string) {
    return db.test.findUnique({
      where: { id },
      include: {
        class: { include: { _count: { select: { enrollments: true } } } },
        institution: true,
        papers: { orderBy: { sortOrder: "asc" } },
        assignments: { include: { student: true, paper: true } },
        attempts: true,
        _count: { select: { assignments: true, attempts: true } },
      },
    });
  },

  async syncWindows(institutionId?: string | null) {
    const tests = await db.test.findMany({
      where: { status: "PUBLISHED", ...(institutionId ? { institutionId } : {}) },
      select: { id: true, status: true, startAt: true, endAt: true, examStatus: true },
    });
    const running = await db.studentTestAttempt.findMany({ where: { status: "IN_PROGRESS", ...(institutionId ? { test: { institutionId } } : {}) }, include: { test: true } });
    for (const attempt of running) if (attemptRemaining(attempt) <= 0) await resultService.grade(attempt.id);
    const now = new Date();
    for (const test of tests) {
      const window = examWindow({ ...test, now });
      const next = examStatusFromWindow(window, true);
      if (next !== test.examStatus) {
        await db.test.update({ where: { id: test.id }, data: { examStatus: next } });
      }
      if (window === "CLOSED") {
        const open = await db.studentTestAttempt.findMany({
          where: { testId: test.id, status: "IN_PROGRESS" },
          select: { id: true },
        });
        for (const attempt of open) {
          await resultService.grade(attempt.id);
        }
      }
    }
  },

  async monitor(testId: string) {
    await this.syncWindows();
    const test = await this.get(testId);
    if (!test) return null;
    const started = test.attempts.filter((row) => row.status !== "NOT_STARTED").length;
    const inProgress = test.attempts.filter((row) => row.status === "IN_PROGRESS").length;
    const completed = test.attempts.filter((row) => row.status === "SUBMITTED").length;
    const total = test.assignments.length;
    return {
      test,
      total,
      started,
      inProgress,
      completed,
      notStarted: Math.max(0, total - started),
    };
  },

  async createScheduledExam(input: {
    institutionId: string;
    classId: string;
    createdById?: string;
    title: string;
    syllabusId?: string;
    topicText?: string;
    content?: string;
    questionCount: number;
    difficulty?: "EASY" | "MEDIUM" | "HARD";
    mixed?: boolean;
    variationCount: number;
    durationMinutes: number;
    startAt: Date;
    endAt: Date;
  }) {
    validateSchedule(input.startAt, input.endAt, input.durationMinutes);
    const cls = await db.class.findUnique({
      where: { id: input.classId },
      include: { enrollments: { where: { student: { status: "ACTIVE" } } } },
    });
    if (!cls || cls.institutionId !== input.institutionId) {
      throw Object.assign(new Error("Class not found"), { status: 404 });
    }

    if (!cls.enrollments.length) throw Object.assign(new Error("Add active students to this class before scheduling"), { status: 400 });
    if (input.syllabusId && !(await db.syllabus.findFirst({ where: { id: input.syllabusId, classId: cls.id } }))) throw Object.assign(new Error("Syllabus not found in this class"), { status: 404 });
    let sourceId = input.syllabusId;
    if (input.topicText || input.content) {
      const source = await db.syllabus.create({ data: { institutionId: cls.institutionId, classId: cls.id, title: input.topicText?.slice(0, 120) || input.title, content: input.content || input.topicText!, inputType: "TEXT", createdById: input.createdById } });
      sourceId = source.id;
    }
    const poolWhere = { classId: cls.id, ...(sourceId ? { syllabusId: sourceId } : {}), ...(input.difficulty && !input.mixed ? { difficulty: input.difficulty } : {}) };
    let pool = await db.question.findMany({ where: poolWhere, orderBy: { usageCount: "asc" } });
    if (pool.length < input.questionCount) {
      await questionService.generate({ classId: cls.id, syllabusId: sourceId, count: input.questionCount - pool.length, difficulty: input.mixed ? undefined : input.difficulty, persist: true, topicName: input.topicText, syllabusText: input.content || input.topicText });
      pool = await db.question.findMany({ where: poolWhere, orderBy: { usageCount: "asc" } });
    }
    if (pool.length < input.questionCount) throw Object.assign(new Error(`Only ${pool.length} matching questions available; ${input.questionCount} requested.`), { status: 422 });
    const selectedCount = input.questionCount;
    const examBank = shuffle(pool).sort((a, b) => a.usageCount - b.usageCount).slice(0, selectedCount);
    const bankIds = examBank.map((question) => question.id);
    const variations = Math.max(1, Math.min(input.variationCount, 8, cls.enrollments.length));

    const test = await db.$transaction(async (tx) => {
      const created = await tx.test.create({
        data: {
          institutionId: input.institutionId,
          classId: input.classId,
          syllabusId: sourceId,
          title: input.title,
          durationMinutes: input.durationMinutes,
          totalQuestions: selectedCount,
          status: "PUBLISHED",
          examStatus: "SCHEDULED",
          examDate: input.startAt,
          startAt: input.startAt,
          endAt: input.endAt,
          variationCount: variations,
          publishedAt: new Date(),
          createdById: input.createdById,
        },
      });

      await tx.testQuestion.createMany({
        data: bankIds.map((questionId, index) => ({
          testId: created.id,
          questionId,
          questionOrder: index,
          optionOrderJson: ["A", "B", "C", "D"] as unknown as Prisma.InputJsonValue,
        })),
      });

      const variationCount = variations;
      const papers = [];
      for (let i = 0; i < variationCount; i += 1) {
        const ordered = shuffle(bankIds);
        papers.push(
          await tx.paperVariation.create({
            data: {
              testId: created.id,
              label: `Paper ${paperLabel(i)}`,
              sortOrder: i,
              questionIdsJson: ordered as unknown as Prisma.InputJsonValue,
            },
          }),
        );
      }

      const students = shuffle(cls.enrollments);
      for (const [index, enrollment] of students.entries()) {
        const paper = papers[index % papers.length]!;
        const questionIds = shuffle(paper.questionIdsJson as string[]);
        const optionOrder: Record<string, string[]> = {};
        for (const questionId of questionIds) {
          const question = pool.find((item) => item.id === questionId);
          optionOrder[questionId] = shuffle(question ? optionKeys(question) : ["A", "B", "C", "D"]);
        }
        await tx.testAssignment.create({
          data: {
            testId: created.id,
            studentId: enrollment.studentId,
            paperVariationId: paper.id,
            questionOrderJson: questionIds as unknown as Prisma.InputJsonValue,
            optionOrderJson: optionOrder as unknown as Prisma.InputJsonValue,
            status: "ASSIGNED",
          },
        });
      }

      await tx.question.updateMany({ where: { id: { in: bankIds } }, data: { usageCount: { increment: 1 } } });
      return created;
    });

    await notificationService.notifyExamScheduled(test.id);
    await this.syncWindows(input.institutionId);
    return this.get(test.id);
  },

  async reschedule(testId: string, startAt: Date, endAt: Date, durationMinutes: number) {
    const test = await db.test.findUnique({ where: { id: testId } });
    if (!test) throw Object.assign(new Error("Exam not found"), { status: 404 });
    if (await db.studentTestAttempt.count({ where: { testId } })) throw Object.assign(new Error("An exam with existing attempts cannot be rescheduled"), { status: 409 });
    validateSchedule(startAt, endAt, durationMinutes);
    const updated = await db.test.update({
      where: { id: testId },
      data: {
        startAt,
        endAt,
        examDate: startAt,
        durationMinutes,
        examStatus: "SCHEDULED",
      },
    });
    await notificationService.notifyExamRescheduled(testId);
    return updated;
  },
};
