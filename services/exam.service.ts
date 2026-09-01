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

    if (input.topicText || input.content) {
      await questionService.generate({
        classId: input.classId,
        count: Math.max(input.questionCount, 10),
        difficulty: input.mixed ? undefined : input.difficulty,
        persist: true,
        topicName: input.topicText,
        syllabusText: input.content ?? input.topicText,
      });
    } else {
      const existing = await db.question.count({ where: { classId: input.classId } });
      if (existing < input.questionCount) {
        await questionService.generate({
          classId: input.classId,
          count: input.questionCount - existing + 5,
          difficulty: input.mixed ? undefined : input.difficulty,
          persist: true,
        });
      }
    }

    const pool = await db.question.findMany({
      where: {
        classId: input.classId,
        ...(input.syllabusId ? { syllabusId: input.syllabusId } : {}),
        ...(input.difficulty && !input.mixed ? { difficulty: input.difficulty } : {}),
      },
    });
    if (pool.length < 1) throw Object.assign(new Error("No questions available"), { status: 400 });
    const selectedCount = Math.min(input.questionCount, pool.length);
    const examBank = shuffle(pool).slice(0, selectedCount);
    const bankIds = examBank.map((question) => question.id);

    const test = await db.$transaction(async (tx) => {
      const created = await tx.test.create({
        data: {
          institutionId: input.institutionId,
          classId: input.classId,
          syllabusId: input.syllabusId,
          title: input.title,
          durationMinutes: input.durationMinutes,
          totalQuestions: selectedCount,
          status: "PUBLISHED",
          examStatus: "SCHEDULED",
          examDate: input.startAt,
          startAt: input.startAt,
          endAt: input.endAt,
          variationCount: Math.max(1, input.variationCount),
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

      const variationCount = Math.max(1, Math.min(input.variationCount, 8));
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

      const students = cls.enrollments;
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

      return created;
    });

    await notificationService.notifyExamScheduled(test.id);
    await this.syncWindows(input.institutionId);
    return this.get(test.id);
  },

  async reschedule(testId: string, startAt: Date, endAt: Date, durationMinutes: number) {
    const test = await db.test.findUnique({ where: { id: testId } });
    if (!test) throw Object.assign(new Error("Exam not found"), { status: 404 });
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
