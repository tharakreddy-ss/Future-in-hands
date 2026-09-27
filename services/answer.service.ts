import { attemptRemaining } from "@/lib/attempt-deadline";
import { db } from "@/lib/db";
import { examWindow } from "@/lib/exam-window";
import { resultService } from "@/services/result.service";

export const answerService = {
  async save(input: {
    attemptId: string;
    questionId: string;
    selectedAnswer: string | null;
    timeSpentSeconds?: number;
    currentQuestionIndex?: number;
  }, studentId: string) {
    const outcome = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM student_test_attempts WHERE id = ${input.attemptId} FOR UPDATE`;
    const attempt = await tx.studentTestAttempt.findUnique({
      where: { id: input.attemptId },
      include: { test: true, assignment: true },
    });
    if (!attempt || attempt.studentId !== studentId) {
      throw Object.assign(new Error("Attempt not found"), { status: 404 });
    }
    if (attempt.status !== "IN_PROGRESS" || !attempt.assignment || attempt.assignment.studentId !== studentId) {
      throw Object.assign(new Error("Attempt is locked"), { status: 400 });
    }
    const window = examWindow(attempt.test);
    if (window === "CLOSED" || attemptRemaining(attempt) <= 0) return { expired: true } as const;
    if (window === "LOCKED") {
      throw Object.assign(new Error("This exam is locked"), { status: 403 });
    }
    const assignedQuestionIds = attempt.assignment.questionOrderJson as string[];
    if (!assignedQuestionIds.includes(input.questionId)) {
      throw Object.assign(new Error("Question is not part of this exam paper"), { status: 403 });
    }
    const question = await tx.question.findFirst({
      where: { id: input.questionId, tests: { some: { testId: attempt.testId } } },
      select: { optionsJson: true },
    });
    if (!question) throw Object.assign(new Error("Question not found"), { status: 404 });
    const optionKeys = (question.optionsJson as Array<{ key: string }>).map((option) => option.key);
    if (input.selectedAnswer != null && !optionKeys.includes(input.selectedAnswer)) {
      throw Object.assign(new Error("Invalid answer option"), { status: 400 });
    }
    if (input.currentQuestionIndex != null && (!Number.isInteger(input.currentQuestionIndex) || input.currentQuestionIndex < 0 || input.currentQuestionIndex >= assignedQuestionIds.length)) {
      throw Object.assign(new Error("Invalid question position"), { status: 400 });
    }

    await tx.studentAnswer.upsert({
      where: { attemptId_questionId: { attemptId: input.attemptId, questionId: input.questionId } },
      create: { attemptId: input.attemptId, questionId: input.questionId, selectedAnswer: input.selectedAnswer },
      update: { selectedAnswer: input.selectedAnswer, answeredAt: new Date() },
    });

    if (input.currentQuestionIndex != null) {
      await tx.studentTestAttempt.update({
        where: { id: input.attemptId },
        data: { currentQuestionIndex: input.currentQuestionIndex },
      });
    }
    return { saved: true, questionId: input.questionId } as const;
    });
    if ("expired" in outcome) {
      await resultService.grade(input.attemptId);
      throw Object.assign(new Error("Time is up. Your saved answers have been submitted."), { status: 403 });
    }
    return outcome;
  },
};
