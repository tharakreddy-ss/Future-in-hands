"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { type AttemptPayload, useTestAttempt } from "@/hooks/use-test-attempt";
import { useTimer } from "@/hooks/use-timer";
import { QuestionScreen } from "@/components/examination/question-screen";
import { QuestionNavigation } from "@/components/examination/question-navigation";
import { Timer } from "@/components/examination/timer";
import { SubmitDialog } from "@/components/examination/submit-dialog";
import { Button } from "@/components/ui/button";
import type { QuestionOption } from "@/types";

export function ExamRunner({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const { attempt, loading, error: loadError, questions, current, index, setIndex, reload } = useTestAttempt(attemptId);
  useEffect(() => {
    if (attempt && attempt.status !== "IN_PROGRESS") router.replace(`/student/results/${attemptId}`);
  }, [attempt, attemptId, router]);
  if (loadError) return <div role="alert" className="p-8">{loadError}<Button onClick={() => void reload()}>Retry</Button></div>;
  if (loading || !attempt || !current) return <div className="mx-auto max-w-3xl space-y-4 p-6" aria-label="Loading exam"><div className="h-8 w-48 animate-pulse rounded bg-white/10" /><div className="h-64 animate-pulse rounded-2xl bg-white/5" /></div>;
  return <LoadedExam key={attempt.id} attemptId={attemptId} attempt={attempt} questions={questions} current={current} index={index} setIndex={setIndex} reload={reload} />;
}
function LoadedExam({ attemptId, attempt, questions, current, index, setIndex, reload }: {
  attemptId: string; attempt: AttemptPayload; questions: AttemptPayload["test"]["questions"]; current: AttemptPayload["test"]["questions"][number]; index: number; setIndex: (index: number) => void; reload: () => Promise<void>;
}) {
  const router = useRouter();
  const [selectedMap, setSelectedMap] = useState<Record<string, string>>(() => Object.fromEntries(attempt.answers.filter((a) => a.selectedAnswer).map((a) => [a.questionId, a.selectedAnswer!])));
  const [confirm, setConfirm] = useState(false);
  const submitted = useRef(false);
  const queue = useRef(Promise.resolve());
  const pendingAnswers = useRef<Record<string, { answer: string; index: number }>>({});
  const [saveState, setSaveState] = useState("All answers saved");
  const [saveError, setSaveError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = useCallback(async (deadline = false) => {
    if (submitted.current) return;
    submitted.current = true;
    setSubmitting(true);
    await queue.current;
    if (!deadline && Object.keys(pendingAnswers.current).length) {
      submitted.current = false; setSubmitting(false);
      setSaveError("Some answers are not saved. Retry saving before submitting."); return;
    }
    try {
      const res = await fetch(`/api/attempts/${attemptId}`, { method: "POST" });
      if (!res.ok) throw new Error("Submission failed. Please retry.");
      sessionStorage.removeItem(`exam-pending:${attemptId}`);
      router.replace(`/student/results/${attemptId}`);
    } catch (e) { submitted.current = false; setSaveError(e instanceof Error ? e.message : "Connection lost"); }
    finally { setSubmitting(false); }
  }, [attemptId, router]);

  const onExpire = useCallback(() => {
    void submit(true);
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

  function flushPending() {
    queue.current = queue.current.then(async () => {
      for (const [id, value] of Object.entries(pendingAnswers.current)) {
        setSaveState("Saving…");
        try {
          const res = await fetch("/api/answers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attemptId, questionId: id, selectedAnswer: value.answer, currentQuestionIndex: value.index }) });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Could not save answer");
          if (pendingAnswers.current[id] === value) delete pendingAnswers.current[id];
          sessionStorage.setItem(`exam-pending:${attemptId}`, JSON.stringify(pendingAnswers.current));
          setSaveError("");
        } catch (e) { setSaveError(e instanceof Error ? e.message : "Connection lost. Retry to save your answers."); setSaveState("Not saved"); return; }
      }
      setSaveState("All answers saved");
    });
  }
  function navigate(next: number) {
    setIndex(next);
    void fetch(`/api/attempts/${attemptId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ index: next }) });
  }
  function onSelect(optionKey: string) {
    if (!questionId || submitting) return;
    setSelectedMap((prev) => ({ ...prev, [questionId]: optionKey }));
    pendingAnswers.current[questionId] = { answer: optionKey, index };
    sessionStorage.setItem(`exam-pending:${attemptId}`, JSON.stringify(pendingAnswers.current));
    flushPending();
  }
  useEffect(() => {
    if (!attempt || attempt.status !== "IN_PROGRESS") return;
    try {
      const cached = JSON.parse(sessionStorage.getItem(`exam-pending:${attemptId}`) || "{}");
      pendingAnswers.current = cached;
      // Restore from the external browser store before queuing network retries.
      const restored = Object.fromEntries(Object.entries(cached).map(([id, v]) => [id, (v as { answer: string }).answer]));
      if (Object.keys(restored).length) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronizing unsaved browser storage, not derived props
        setSelectedMap((previous) => ({ ...previous, ...restored }));
      }
    } catch { sessionStorage.removeItem(`exam-pending:${attemptId}`); }
    const online = () => flushPending();
    online();
    window.addEventListener("online", online);
    return () => window.removeEventListener("online", online);
    // This queue belongs to the loaded attempt and survives question navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, attemptId]);

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
        <div aria-live="polite" className="mb-4 text-sm text-slate-400">{submitting ? "Submitting…" : saveState}</div>
        {saveError ? <div role="alert" className="mb-4 rounded-xl border border-amber-500/30 p-3 text-sm text-amber-200">{saveError} <button className="underline" onClick={flushPending}>Retry save</button> <button className="underline" onClick={() => void reload()}>Check exam status</button></div> : null}
        <QuestionScreen
          stem={current.question.questionText}
          options={displayOptions}
          selected={selected ? [selected] : []}
          onSelect={onSelect}
        />
        <div className="mt-8 flex items-center justify-between">
          <Button variant="secondary" disabled={index === 0 || submitting} onClick={() => navigate(index - 1)}>
            Previous
          </Button>
          {index < questions.length - 1 ? (
            <Button disabled={submitting} onClick={() => navigate(index + 1)}>Next</Button>
          ) : (
            <Button disabled={submitting} onClick={() => setConfirm(true)}>Submit Exam</Button>
          )}
        </div>
      </div>
      <aside className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-[#11182A] p-4 shadow-sm">
          <p className="mb-3 text-sm font-medium">Navigation</p>
          <QuestionNavigation total={questions.length} index={index} answered={answered} onJump={navigate} />
        </div>
        <Button className="w-full" variant="danger" onClick={() => setConfirm(true)}>
          Submit exam
        </Button>
      </aside>
      <SubmitDialog open={confirm} onCancel={() => setConfirm(false)} onConfirm={() => void submit()} />
    </div>
  );
}
