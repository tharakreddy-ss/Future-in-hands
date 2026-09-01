"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTestAttempt } from "@/hooks/use-test-attempt";
import { useTimer } from "@/hooks/use-timer";
import { QuestionScreen } from "@/components/examination/question-screen";
import { QuestionNavigation } from "@/components/examination/question-navigation";
import { Timer } from "@/components/examination/timer";
import { SubmitDialog } from "@/components/examination/submit-dialog";
import { Button } from "@/components/ui/button";
import type { QuestionOption } from "@/types";

export function ExamRunner({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const { attempt, loading, questions, current, index, setIndex } = useTestAttempt(attemptId);
  const [selectedMap, setSelectedMap] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState(false);
  const submitted = useRef(false);

  useEffect(() => {
    if (!attempt) return;
    if (attempt.status !== "IN_PROGRESS") {
      router.replace(`/student/results/${attemptId}`);
      return;
    }
    const next: Record<string, string> = {};
    for (const answer of attempt.answers) {
      if (answer.selectedAnswer) next[answer.questionId] = answer.selectedAnswer;
    }
    setSelectedMap(next);
  }, [attempt, attemptId, router]);

  const submit = useCallback(async () => {
    if (submitted.current) return;
    submitted.current = true;
    await fetch(`/api/attempts/${attemptId}`, { method: "POST" });
    router.replace(`/student/results/${attemptId}`);
  }, [attemptId, router]);

  const onExpire = useCallback(() => {
    void submit();
  }, [submit]);

  const { label } = useTimer(attempt?.remainingSeconds ?? 0, onExpire);
  const questionId = current?.question.id;
  const selected = questionId ? selectedMap[questionId] : undefined;

  const displayOptions = useMemo(() => {
    if (!current) return [];
    const options = (current.question.optionsJson ?? []) as QuestionOption[];
    const order = (current.optionOrderJson ?? options.map((o) => o.key)) as string[];
    return order
      .map((key) => options.find((option) => option.key === key))
      .filter(Boolean)
      .map((option) => ({ id: option!.key, text: option!.text }));
  }, [current]);

  const answered = useMemo(() => {
    const set = new Set<number>();
    questions.forEach((item, i) => {
      if (selectedMap[item.question.id]) set.add(i);
    });
    return set;
  }, [questions, selectedMap]);

  async function persist(nextSelected: string) {
    if (!questionId) return;
    await fetch("/api/answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptId,
        questionId,
        selectedAnswer: nextSelected,
        currentQuestionIndex: index,
      }),
    });
  }

  function onSelect(optionKey: string) {
    if (!questionId) return;
    setSelectedMap((prev) => ({ ...prev, [questionId]: optionKey }));
    void persist(optionKey);
  }

  if (loading || !attempt || !current) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-white/10" />
        <div className="h-40 animate-pulse rounded-2xl bg-[#11182A]" />
        <div className="h-24 animate-pulse rounded-2xl bg-[#11182A]" />
      </div>
    );
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-6xl gap-6 p-4 sm:p-6 lg:grid-cols-[1fr_280px]">
      <div className="rounded-2xl border border-white/10 bg-[#11182A] p-5 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-violet-300">{attempt.test.title}</p>
            <p className="text-sm text-slate-500">
              Question {index + 1} of {questions.length}
            </p>
          </div>
          <Timer label={label} />
        </div>
        <QuestionScreen
          stem={current.question.questionText}
          options={displayOptions}
          selected={selected ? [selected] : []}
          onSelect={onSelect}
        />
        <div className="mt-8 flex items-center justify-between">
          <Button variant="secondary" disabled={index === 0} onClick={() => setIndex(index - 1)}>
            Previous
          </Button>
          {index < questions.length - 1 ? (
            <Button onClick={() => setIndex(index + 1)}>Next</Button>
          ) : (
            <Button onClick={() => setConfirm(true)}>Submit Exam</Button>
          )}
        </div>
      </div>
      <aside className="space-y-4">
        <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm">
          <p className="mb-3 text-sm font-medium">Navigation</p>
          <QuestionNavigation total={questions.length} index={index} answered={answered} onJump={setIndex} />
        </div>
        <Button className="w-full" variant="danger" onClick={() => setConfirm(true)}>
          Submit exam
        </Button>
      </aside>
      <SubmitDialog open={confirm} onCancel={() => setConfirm(false)} onConfirm={() => void submit()} />
    </div>
  );
}
