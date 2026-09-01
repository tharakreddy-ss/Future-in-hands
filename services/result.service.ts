import { db } from "@/lib/db";

export const resultService = {
  async grade(attemptId: string) {
    return db.$transaction(async (tx) => {
      const attempt = await tx.studentTestAttempt.findUnique({
        where: { id: attemptId },
        include: {
          answers: true,
          test: { include: { questions: { include: { question: true } } } },
        },
      });
      if (!attempt) throw new Error("Attempt not found");

      let correct = 0;
      let wrong = 0;
      let unanswered = 0;

      for (const item of attempt.test.questions) {
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

      const total = attempt.test.questions.length || attempt.totalQuestions;
      const score = correct;
      const percentage = total ? (score / total) * 100 : 0;
      const timeTaken = Math.max(
        0,
        attempt.test.durationMinutes * 60 - attempt.remainingSeconds,
      );

      const updated = await tx.studentTestAttempt.update({
        where: { id: attemptId },
        data: {
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
