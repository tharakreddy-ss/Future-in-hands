"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PracticeCheckResult, PublicPracticeQuestion } from "@/services/practice.service";

export function PracticeQuestion({
  index,
  total,
  question,
  selected,
  result,
  pending,
  error,
  onSelect,
  onCheck,
  onNext,
}: {
  index: number;
  total: number;
  question: PublicPracticeQuestion;
  selected: string | null;
  result: PracticeCheckResult | null;
  pending: boolean;
  error: string | null;
  onSelect: (key: string) => void;
  onCheck: () => void;
  onNext: () => void;
}) {
  const checked = Boolean(result);

  return (
    <Card className="hover:translate-y-0">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300/80">
        Question {index + 1} / {total}
      </p>
      <h2 className="mt-3 text-lg font-semibold text-white sm:text-xl">{question.questionText}</h2>
      <div className="mt-6 grid gap-3">
        {question.options.map((option) => {
          const isSelected = selected === option.key;
          const isCorrect = checked && option.key === result?.correctAnswer;
          const isWrongPick = checked && isSelected && !result?.correct;
          return (
            <button
              key={option.key}
              type="button"
              disabled={checked}
              onClick={() => onSelect(option.key)}
              className={cn(
                "flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition",
                !checked && isSelected && "border-violet-400/60 bg-violet-500/15",
                !checked && !isSelected && "border-white/10 bg-[#0B1020]/70 hover:border-white/25",
                isCorrect && "border-emerald-400/60 bg-emerald-500/15",
                isWrongPick && "border-red-400/60 bg-red-500/15",
                checked && !isCorrect && !isWrongPick && "border-white/10 bg-[#0B1020]/40 opacity-70",
              )}
            >
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-xl border text-sm font-semibold",
                  isCorrect && "border-emerald-300/50 text-emerald-200",
                  isWrongPick && "border-red-300/50 text-red-200",
                  !checked && "border-white/15 text-slate-200",
                )}
              >
                {option.key}
              </span>
              <span className="pt-1 text-sm text-slate-100">{option.text}</span>
            </button>
          );
        })}
      </div>
      {result ? (
        <div
          className={cn(
            "mt-5 rounded-2xl border px-4 py-3 text-sm",
            result.correct
              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
              : "border-red-400/40 bg-red-500/10 text-red-100",
          )}
        >
          <p className="font-semibold">{result.correct ? "Correct" : "Wrong"}</p>
          <p className="mt-1 text-slate-200">Correct answer: {result.correctAnswer}</p>
          {result.explanation ? <p className="mt-2 text-slate-300">{result.explanation}</p> : null}
        </div>
      ) : null}
      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        {!checked ? (
          <Button type="button" onClick={onCheck} disabled={!selected || pending} className="w-full sm:w-auto">
            {pending ? "Checking…" : "Check Answer"}
          </Button>
        ) : (
          <Button type="button" onClick={onNext} className="w-full sm:w-auto">
            {index + 1 === total ? "See summary" : "Next Question"}
          </Button>
        )}
      </div>
    </Card>
  );
}
