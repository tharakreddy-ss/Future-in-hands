import { attemptRepository } from "@/repositories/attempt.repository";
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
  }) {
    const attempt = await db.studentTestAttempt.findUnique({
      where: { id: input.attemptId },
      include: { test: true },
    });
    if (!attempt || attempt.status !== "IN_PROGRESS") {
      throw Object.assign(new Error("Attempt is locked"), { status: 400 });
    }
    const window = examWindow(attempt.test);
    if (window === "CLOSED") {
      await resultService.grade(attempt.id);
      throw Object.assign(new Error("This exam is closed"), { status: 403 });
    }
    if (window === "LOCKED") {
      throw Object.assign(new Error("This exam is locked"), { status: 403 });
    }
    const question = await db.question.findUnique({ where: { id: input.questionId } });
    const isCorrect =
      input.selectedAnswer == null ? null : input.selectedAnswer === question?.correctAnswer;

    const saved = await attemptRepository.saveAnswer({
      attemptId: input.attemptId,
      questionId: input.questionId,
      selectedAnswer: input.selectedAnswer,
      isCorrect,
      timeSpentSeconds: input.timeSpentSeconds,
    });

    if (input.currentQuestionIndex != null) {
      await db.studentTestAttempt.update({
        where: { id: input.attemptId },
        data: { currentQuestionIndex: input.currentQuestionIndex },
      });
    }
    return saved;
  },
};
