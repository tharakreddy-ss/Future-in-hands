import { attemptDeadline } from "@/lib/attempt-deadline";
import { db } from "@/lib/db";

export const resultService = {
  async grade(attemptId: string) {
    return db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM student_test_attempts WHERE id = ${attemptId} FOR UPDATE`;
      const attempt = await tx.studentTestAttempt.findUnique({
        where: { id: attemptId },
        include: {
          answers: true,
          assignment: true,
          test: { include: { questions: { include: { question: true } } } },
        },
      });
      if (!attempt) throw new Error("Attempt not found");
      if (attempt.status === "SUBMITTED") return attempt;

      let correct = 0;
      let wrong = 0;
      let unanswered = 0;

      const assignedIds = attempt.assignment?.questionOrderJson as string[] | undefined;
      const questions = assignedIds?.length ? attempt.test.questions.filter((item) => assignedIds.includes(item.questionId)) : attempt.test.questions;
      for (const item of questions) {
        const answer = attempt.answers.find((row) => row.questionId === item.questionId);
        const selected = answer?.selectedAnswer ?? null;
        if (!selected) {
          unanswered += 1;
          continue;
        }
        const isCorrect = selected === item.question.correctAnswer;
        if (isCorrect) correct += 1;
        else wrong += 1;
        if (answer) {
          await tx.studentAnswer.update({
            where: { id: answer.id },
            data: { isCorrect },
          });
        }
      }

      const total = questions.length || attempt.totalQuestions;
      const score = correct;
      const percentage = total ? (score / total) * 100 : 0;
      const timeTaken = Math.max(
        0,
        Math.floor((Math.min(Date.now(), attemptDeadline(attempt)) - attempt.startedAt.getTime()) / 1000),
      );

      const updated = await tx.studentTestAttempt.update({
        where: { id: attemptId },
        data: {
          totalQuestions: total,
          status: "SUBMITTED",
          submittedAt: new Date(),
          remainingSeconds: 0,
          correctAnswers: correct,
          wrongAnswers: wrong,
          unansweredQuestions: unanswered,
          score,
          percentage,
          timeTakenSeconds: timeTaken,
        },
      });

      await tx.testAssignment.updateMany({
        where: { testId: attempt.testId, studentId: attempt.studentId },
        data: { status: "COMPLETED" },
      });

      return updated;
    });
  },
  getByAttempt(attemptId: string) {
    return db.studentTestAttempt.findUnique({
      where: { id: attemptId },
      include: {
        student: true,
        answers: true,
        test: {
          include: {
            class: true,
            questions: { include: { question: { include: { topic: true } } } },
          },
        },
      },
    });
  },
};
