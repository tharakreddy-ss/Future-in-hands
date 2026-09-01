import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export const testRepository = {
  list(classId: string) {
    return db.test.findMany({
      where: { classId },
      include: { questions: true, assignments: true },
      orderBy: { createdAt: "desc" },
    });
  },
  get(id: string) {
    return db.test.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { questionOrder: "asc" },
          include: { question: true },
        },
        assignments: true,
        class: true,
      },
    });
  },
  create(data: {
    institutionId: string;
    classId: string;
    syllabusId?: string;
    title: string;
    durationMinutes: number;
    totalQuestions: number;
    createdById?: string;
    questionIds?: string[];
  }) {
    return db.test.create({
      data: {
        institutionId: data.institutionId,
        classId: data.classId,
        syllabusId: data.syllabusId,
        title: data.title,
        durationMinutes: data.durationMinutes,
        totalQuestions: data.totalQuestions,
        createdById: data.createdById,
        questions: data.questionIds
          ? {
              create: data.questionIds.map((questionId, index) => ({
                questionId,
                questionOrder: index,
                optionOrderJson: ["A", "B", "C", "D"] as unknown as Prisma.InputJsonValue,
              })),
            }
          : undefined,
      },
      include: { questions: true },
    });
  },
  publish(id: string) {
    return db.test.update({
      where: { id },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });
  },
};
