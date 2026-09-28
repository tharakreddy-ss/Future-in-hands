"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/layout/empty-state";
import type { PracticeSetupClass } from "@/services/practice.service";

const SELECT_CLASS =
  "w-full rounded-xl border border-white/10 bg-[#0B1020] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-violet-400/50 focus:ring-4 focus:ring-violet-500/15";
const MIN_COUNT = 5;
const MAX_COUNT = 30;

export function PracticeSetup({
  classes,
  aiAvailable,
}: {
  classes: PracticeSetupClass[];
  aiAvailable: boolean;
}) {
  const router = useRouter();
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const selectedClass = useMemo(
    () => classes.find((row) => row.id === classId) ?? classes[0],
    [classes, classId],
  );
  const [subjectKey, setSubjectKey] = useState(selectedClass?.subjects[0]?.key ?? "class");
  const topics = selectedClass?.topicsBySubject[subjectKey] ?? [];
  const [topicKey, setTopicKey] = useState("");
  const [difficulty, setDifficulty] = useState("ANY");
  const [count, setCount] = useState(MIN_COUNT);
  const [source, setSource] = useState<"BANK" | "AI">("BANK");
  const [available, setAvailable] = useState<number | null>(null);
  const [availableLoading, setAvailableLoading] = useState(source === "BANK");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const bankMax = available == null ? MAX_COUNT : Math.min(MAX_COUNT, available);
  const bankTooFew = source === "BANK" && available != null && available < MIN_COUNT;
  const minCount = source === "BANK" && bankTooFew ? Math.max(available ?? 0, 0) : MIN_COUNT;
  const maxCount = source === "BANK" ? Math.max(bankMax, 0) : MAX_COUNT;
  const effectiveCount =
    source === "BANK" && available != null
      ? bankTooFew
        ? available
        : Math.min(Math.max(count, MIN_COUNT), bankMax)
      : Math.min(MAX_COUNT, Math.max(MIN_COUNT, count));
  const startDisabled =
    pending ||
    (source === "AI" && !aiAvailable) ||
    (source === "BANK" && (availableLoading || available == null || bankTooFew || effectiveCount > available));

  useEffect(() => {
    if (!classId || source !== "BANK") return;
    const controller = new AbortController();
    const params = new URLSearchParams({ classId, subjectKey, topicKey, difficulty });
    fetch(`/api/student/practice/availability?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json()) as { available?: number; error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Unable to count questions.");
        setAvailable(typeof payload.available === "number" ? payload.available : 0);
        setAvailableLoading(false);
      })
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === "AbortError") return;
        setAvailable(0);
        setAvailableLoading(false);
        setError(err instanceof Error ? err.message : "Unable to count unused questions.");
      });
    return () => controller.abort();
  }, [classId, subjectKey, topicKey, difficulty, source]);

  if (classes.length === 0) {
    return (
      <EmptyState
        title="No enrolled classes"
        description="Practice is limited to classrooms you are enrolled in. Ask your institution to add you to a class."
        actionHref="/student/classes"
        actionLabel="View classes"
      />
    );
  }

  function onClassChange(value: string) {
    setClassId(value);
    const next = classes.find((row) => row.id === value);
    setSubjectKey(next?.subjects[0]?.key ?? "class");
    setTopicKey("");
    setAvailable(null);
    setAvailableLoading(true);
    setError(null);
  }

  function onSubjectChange(value: string) {
    setSubjectKey(value);
    setTopicKey("");
    setAvailable(null);
    setAvailableLoading(true);
    setError(null);
  }

  function onFilterChange() {
    setAvailable(null);
    setAvailableLoading(true);
    setError(null);
  }

  async function startPractice(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (source === "AI" && !aiAvailable) {
      setError("AI Quiz is currently unavailable. Please try Question Bank practice.");
      return;
    }
    if (source === "BANK" && (available == null || available < MIN_COUNT)) return;
    setPending(true);
    try {
      const response = await fetch("/api/student/practice/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          subjectKey,
          topicKey,
          difficulty,
          count: effectiveCount,
          source,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Unable to start practice.");
        return;
      }
      router.push("/student/practice/run");
    } catch {
      setError("Unable to start practice. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={startPractice} className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <Card className="space-y-5 hover:translate-y-0">
        <div>
          <h2 className="text-lg font-semibold text-white">Practice setup</h2>
          <p className="mt-1 text-sm text-slate-500">
            This is a learning quiz. Scores are not saved to official Results or Analytics.
          </p>
        </div>
        <label className="block space-y-2 text-sm text-slate-300">
          <span>Class</span>
          <select value={classId} onChange={(event) => onClassChange(event.target.value)} className={SELECT_CLASS} required>
            {classes.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2 text-sm text-slate-300">
          <span>Subject</span>
          <select
            value={subjectKey}
            onChange={(event) => onSubjectChange(event.target.value)}
            className={SELECT_CLASS}
            required
          >
            {(selectedClass?.subjects ?? []).map((row) => (
              <option key={row.key} value={row.key}>
                {row.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2 text-sm text-slate-300">
          <span>Topic</span>
          <select
            value={topicKey}
            onChange={(event) => {
              setTopicKey(event.target.value);
              onFilterChange();
            }}
            className={SELECT_CLASS}
          >
            <option value="">Any available topic</option>
            {topics.map((row) => (
              <option key={row.key} value={row.key}>
                {row.label}
              </option>
            ))}
          </select>
          {topics.length === 0 ? (
            <span className="block text-xs text-slate-500">No syllabus topics are listed for this subject yet.</span>
          ) : null}
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2 text-sm text-slate-300">
            <span>Difficulty</span>
            <select
              value={difficulty}
              onChange={(event) => {
                setDifficulty(event.target.value);
                onFilterChange();
              }}
              className={SELECT_CLASS}
            >
              <option value="ANY">Any</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </label>
          <div className="space-y-2 text-sm text-slate-300">
            <span className="block">Question count</span>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                className="h-11 w-11 px-0"
                onClick={() => setCount(effectiveCount - 1)}
                disabled={effectiveCount <= minCount || bankTooFew}
                aria-label="Decrease question count"
              >
                −
              </Button>
              <span className="min-w-10 text-center text-lg font-semibold text-white">{effectiveCount}</span>
              <Button
                type="button"
                variant="secondary"
                className="h-11 w-11 px-0"
                onClick={() => setCount(effectiveCount + 1)}
                disabled={effectiveCount >= maxCount || (source === "BANK" && (available == null || available < MIN_COUNT))}
                aria-label="Increase question count"
              >
                +
              </Button>
            </div>
            {source === "BANK" ? (
              <p className="text-xs text-slate-500">
                {availableLoading || available == null
                  ? "Counting unused questions…"
                  : `Available questions: ${available}`}
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Choose between {MIN_COUNT} and {MAX_COUNT} questions.
              </p>
            )}
            {source === "BANK" && available != null && available >= MIN_COUNT ? (
              <button
                type="button"
                className="text-xs font-semibold text-violet-300 hover:text-violet-200"
                onClick={() => setCount(Math.min(MAX_COUNT, available))}
              >
                Use all available
              </button>
            ) : null}
          </div>
        </div>
        {source === "BANK" && available != null && available < MIN_COUNT ? (
          <p className="text-sm text-amber-300/90">
            Only {available} unused questions are available for this selection. Try another topic or difficulty.
          </p>
        ) : null}
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <Button type="submit" disabled={startDisabled} className="w-full sm:w-auto">
          {pending ? "Starting…" : "Start practice"}
        </Button>
      </Card>
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => {
            setSource("BANK");
            setAvailableLoading(true);
            setAvailable(null);
            setError(null);
          }}
          className={`w-full rounded-[1.25rem] border p-5 text-left transition ${
            source === "BANK"
              ? "border-violet-400/50 bg-violet-500/10"
              : "border-white/10 bg-[#11182A]/70 hover:border-white/20"
          }`}
        >
          <p className="text-sm font-semibold text-white">Question Bank</p>
          <p className="mt-2 text-sm text-slate-400">Practice from available questions for your enrolled class.</p>
        </button>
        <button
          type="button"
          onClick={() => {
            if (!aiAvailable) return;
            setSource("AI");
            setCount(Math.min(MAX_COUNT, Math.max(MIN_COUNT, effectiveCount)));
          }}
          disabled={!aiAvailable}
          className={`w-full rounded-[1.25rem] border p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-70 ${
            source === "AI"
              ? "border-violet-400/50 bg-violet-500/10"
              : "border-white/10 bg-[#11182A]/70 hover:border-white/20"
          }`}
        >
          <p className="text-sm font-semibold text-white">AI Quiz</p>
          {aiAvailable ? (
            <p className="mt-2 text-sm text-slate-400">
              Generate a fresh practice quiz using the existing AI question generator.
            </p>
          ) : (
            <p className="mt-2 text-sm text-amber-300/90">
              AI Quiz is currently unavailable. Please try Question Bank practice.
            </p>
          )}
        </button>
      </div>
    </form>
  );
}
