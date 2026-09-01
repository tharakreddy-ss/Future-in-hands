import { db } from "@/lib/db";

export const attemptRepository = {
  get(id: string) {
    return db.studentTestAttempt.findUnique({
      where: { id },
      include: {
        answers: true,
        student: true,
        assignment: { include: { paper: true } },
        test: {
          include: {
            class: true,
            questions: {
              orderBy: { questionOrder: "asc" },
              include: {
                question: {
                  select: {
                    id: true,
                    questionText: true,
                    optionsJson: true,
                    difficulty: true,
                    topic: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  },
  findByStudentTest(studentId: string, testId: string) {
    return db.studentTestAttempt.findUnique({
      where: { studentId_testId: { studentId, testId } },
    });
  },
  create(data: {
    studentId: string;
    testId: string;
    assignmentId?: string;
    totalQuestions: number;
    remainingSeconds: number;
  }) {
    return db.studentTestAttempt.create({
      data: { ...data, status: "IN_PROGRESS" },
    });
  },
  saveAnswer(data: {
    attemptId: string;
    questionId: string;
    selectedAnswer: string | null;
    isCorrect?: boolean | null;
    timeSpentSeconds?: number;
  }) {
    return db.studentAnswer.upsert({
      where: { attemptId_questionId: { attemptId: data.attemptId, questionId: data.questionId } },
      update: {
        selectedAnswer: data.selectedAnswer,
        isCorrect: data.isCorrect,
        answeredAt: new Date(),
        timeSpentSeconds: data.timeSpentSeconds ?? 0,
      },
      create: data,
    });
  },
};
