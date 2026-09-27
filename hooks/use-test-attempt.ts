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
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const res = await fetch(`/api/attempts/${attemptId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to load this attempt");
      setAttempt(data as AttemptPayload);
      setIndex(data.currentQuestionIndex ?? 0);
      setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Connection lost"); }
    finally { setLoading(false); }
  }, [attemptId]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/attempts/${attemptId}`, { signal: controller.signal, cache: "no-store" }).then(async (res) => { const data = await res.json(); if (!res.ok) throw new Error(data.error || "Unable to load attempt"); return data as AttemptPayload; }).then((data) => { setAttempt(data); setIndex(data.currentQuestionIndex ?? 0); setLoading(false); }).catch((e) => { if (!controller.signal.aborted) { setError(e.message); setLoading(false); } });
    return () => controller.abort();
  }, [attemptId]);

  const questions = attempt?.test.questions ?? [];
  const current = questions[index];

  return { attempt, loading, error, questions, current, index, setIndex, reload };
}
