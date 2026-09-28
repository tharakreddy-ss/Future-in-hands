"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/layout/empty-state";
import { PracticeQuestion } from "@/components/practice/practice-question";
import { PracticeSummary } from "@/components/practice/practice-summary";
import type { PracticeCheckResult, PublicPracticeSession } from "@/services/practice.service";

export function PracticeRunner() {
  const [session, setSession] = useState<PublicPracticeSession | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/student/practice/session");
        const payload = (await response.json()) as { session?: PublicPracticeSession; error?: string };
        if (!response.ok || !payload.session) {
          if (!cancelled) setFatal(payload.error ?? "Your practice session has expired. Start a new practice quiz.");
          return;
        }
        if (!cancelled) {
          setSession(payload.session);
          const firstUnchecked = payload.session.questions.findIndex((question) => !payload.session!.results[question.id]);
          setIndex(firstUnchecked === -1 ? payload.session.questions.length : firstUnchecked);
        }
      } catch {
        if (!cancelled) setFatal("Unable to load this practice session.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const question = session?.questions[index];
  const result = question ? session.results[question.id] ?? null : null;

  async function checkAnswer() {
    if (!question || !selected) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/student/practice/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, selectedAnswer: selected }),
      });
      const payload = (await response.json()) as { result?: PracticeCheckResult; error?: string };
      if (!response.ok || !payload.result) {
        setError(payload.error ?? "Unable to check that answer.");
        if (response.status === 404) setFatal(payload.error ?? "Your practice session has expired. Start a new practice quiz.");
        return;
      }
      setSession((current) =>
        current
          ? { ...current, results: { ...current.results, [payload.result!.questionId]: payload.result! } }
          : current,
      );
    } catch {
      setError("Unable to check that answer. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return <p className="mt-6 text-sm text-slate-400">Loading practice…</p>;
  }

  if (fatal || !session) {
    return (
      <div className="mt-6">
        <EmptyState
          title="Practice session unavailable"
          description={fatal ?? "Start a new practice quiz from the setup page."}
          actionHref="/student/practice"
          actionLabel="Start New Practice"
        />
      </div>
    );
  }

  if (!question || index >= session.questions.length) {
    return (
      <div className="mt-6">
        <PracticeSummary session={session} />
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <p className="text-sm text-slate-500">
        {session.className}
        {session.subject ? ` · ${session.subject}` : ""}
        {session.topic ? ` · ${session.topic}` : ""}
      </p>
      <PracticeQuestion
        index={index}
        total={session.questions.length}
        question={question}
        selected={selected ?? result?.selectedAnswer ?? null}
        result={result}
        pending={pending}
        error={error}
        onSelect={setSelected}
        onCheck={checkAnswer}
        onNext={() => {
          setSelected(null);
          setError(null);
          setIndex((value) => value + 1);
        }}
      />
      <Link href="/student/practice" className="inline-block text-sm text-slate-500 hover:text-slate-300">
        Leave and start over
      </Link>
    </div>
  );
}
