"use client";

import { useCallback, useEffect, useState } from "react";
import type { QuestionOption } from "@/types";

type AttemptQuestion = {
  id: string;
  questionOrder: number;
  optionOrderJson: string[];
  question: {
    id: string;
    questionText: string;
    optionsJson: QuestionOption[];
  };
};

export type AttemptPayload = {
  id: string;
  remainingSeconds: number;
  status: string;
  currentQuestionIndex: number;
  answers: Array<{
    questionId: string;
    selectedAnswer: string | null;
  }>;
  test: {
    title: string;
    questions: AttemptQuestion[];
  };
};

export function useTestAttempt(attemptId: string) {
  const [attempt, setAttempt] = useState<AttemptPayload | null>(null);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const res = await fetch(`/api/attempts/${attemptId}`);
    const data = (await res.json()) as AttemptPayload;
    setAttempt(data);
    setIndex(data.currentQuestionIndex ?? 0);
    setLoading(false);
  }, [attemptId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const questions = attempt?.test.questions ?? [];
  const current = questions[index];

  return { attempt, loading, questions, current, index, setIndex, reload };
}
