import { attemptDeadline } from "@/lib/attempt-deadline";
import { db } from "@/lib/db";

const attemptReviewInclude = {
  student: true,
  answers: true,
  assignment: true,
  test: {
    include: {
      class: true,
      subject: true,
      questions: { include: { question: { include: { topic: true } } } },
    },
  },
} as const;

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
      include: attemptReviewInclude,
    });
  },
  getSubmittedForStudent(attemptId: string, studentId: string) {
    return db.studentTestAttempt.findFirst({
      where: { id: attemptId, studentId, status: "SUBMITTED" },
      include: attemptReviewInclude,
    });
  },
};

type AttemptResult = NonNullable<Awaited<ReturnType<typeof resultService.getByAttempt>>>;
type QuestionOption = { key: string; text: string };

function optionLabel(options: QuestionOption[], key: string) {
  const match = options.find((option) => option.key === key);
  return match ? `${match.key}. ${match.text}` : key;
}

function orderedOptions(options: QuestionOption[], order: string[] | undefined) {
  if (!order?.length) return options;
  const byKey = new Map(options.map((option) => [option.key, option]));
  return order.flatMap((key) => {
    const option = byKey.get(key);
    return option ? [option] : [];
  });
}

/** Paper order used at grading time; does not change scores. */
export function reviewFromAttempt(result: AttemptResult) {
  const byId = new Map(result.test.questions.map((item) => [item.questionId, item]));
  const assignedIds = (result.assignment?.questionOrderJson as string[] | undefined) ?? [];
  const fallbackIds = [...result.test.questions]
    .sort((a, b) => a.questionOrder - b.questionOrder)
    .map((item) => item.questionId);
  const questionIds = assignedIds.length ? assignedIds.filter((id) => byId.has(id)) : fallbackIds;
  const optionMap = (result.assignment?.optionOrderJson as Record<string, string[]> | undefined) ?? {};
  const answers = new Map(result.answers.map((row) => [row.questionId, row]));

  const items = questionIds.flatMap((questionId, index) => {
    const row = byId.get(questionId);
    if (!row) return [];
    const options = orderedOptions((row.question.optionsJson as QuestionOption[]) ?? [], optionMap[questionId]);
    const selectedKey = answers.get(questionId)?.selectedAnswer ?? null;
    const correctKey = row.question.correctAnswer;
    const marked = answers.get(questionId)?.isCorrect;
    const status: "correct" | "incorrect" | "unanswered" = !selectedKey
      ? "unanswered"
      : marked === true || selectedKey === correctKey
        ? "correct"
        : "incorrect";
    const topicName = row.question.topic?.name?.trim() || null;
    const subtopic = row.question.subtopic?.trim() || null;
    const topicGroup = topicName || subtopic;
    return [
      {
        questionId,
        order: index + 1,
        stem: row.question.questionText,
        topic: topicGroup,
        subtopic: topicName && subtopic && subtopic !== topicName ? subtopic : null,
        options,
        selectedKey,
        selectedText: selectedKey ? optionLabel(options, selectedKey) : null,
        correctKey,
        correctText: optionLabel(options, correctKey),
        status,
        explanation: row.question.explanation?.trim() || null,
      },
    ];
  });

  const topicTotals = new Map<string, { correct: number; wrong: number; unanswered: number; total: number }>();
  for (const item of items) {
    if (!item.topic) continue;
    const current = topicTotals.get(item.topic) ?? { correct: 0, wrong: 0, unanswered: 0, total: 0 };
    current.total += 1;
    if (item.status === "correct") current.correct += 1;
    else if (item.status === "incorrect") current.wrong += 1;
    else current.unanswered += 1;
    topicTotals.set(item.topic, current);
  }
  const topics = [...topicTotals.entries()].map(([topic, value]) => ({
    topic,
    correct: value.correct,
    wrong: value.wrong,
    unanswered: value.unanswered,
    total: value.total,
  }));

  return { items, topics };
}
