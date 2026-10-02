"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarClock, ChevronLeft, ChevronRight, ClipboardList, Clock3, FileQuestion } from "lucide-react";
import { StartTestButton } from "@/components/tests/start-test-button";
import { ExamCountdown } from "@/components/exams/exam-countdown";
import { cn } from "@/lib/utils";
import type { DashboardExam } from "@/services/student-dashboard.service";

function attemptChip(status: string | null) {
  if (status === "SUBMITTED") return { label: "Submitted", className: "border-emerald-400/30 bg-emerald-500/[0.08] text-emerald-300" };
  if (status === "IN_PROGRESS") return { label: "In progress", className: "border-amber-400/30 bg-amber-500/[0.08] text-amber-300" };
  return { label: "New attempt", className: "border-violet-400/35 bg-violet-500/[0.10] text-violet-200" };
}

const linkButton =
  "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70";

function ExamAction({ exam }: { exam: DashboardExam }) {
  if (exam.attemptStatus === "SUBMITTED" && exam.attemptId) {
    return (
      <Link href={`/student/results/${exam.attemptId}`} className={cn(linkButton, "border border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.1]")}>
        View result
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    );
  }
  if (exam.window === "LOCKED") {
    return (
      <Link href={`/student/tests/${exam.testId}`} className={cn(linkButton, "border border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.1]")}>
        View exam
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    );
  }
  return (
    <StartTestButton
      assignmentId={exam.assignmentId}
      attemptId={exam.attemptId ?? undefined}
      status={exam.attemptStatus ?? undefined}
      window={exam.window}
      labels={{ start: "Attempt →", resume: "Continue →" }}
    />
  );
}

function ExamStatus({ exam }: { exam: DashboardExam }) {
  if (exam.attemptStatus === "SUBMITTED") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
        Submitted{exam.window === "LIVE" ? " · window open" : ""}
      </span>
    );
  }
  if (exam.window === "LIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300">
        <span className="relative flex h-2 w-2" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60 motion-reduce:animate-none" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        Live now
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-300">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />
      {exam.startAt ? (
        <>
          Upcoming · starts in <ExamCountdown startAt={exam.startAt} />
        </>
      ) : (
        "Upcoming"
      )}
    </span>
  );
}

function ExamSlide({ exam, index, total }: { exam: DashboardExam; index: number; total: number }) {
  const chip = attemptChip(exam.attemptStatus);
  return (
    <article
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${total}: ${exam.title}`}
      className="flex h-full flex-col gap-6 rounded-2xl border border-white/[0.08] bg-[#111a30] p-6 sm:p-7"
    >
      <div className="flex items-start justify-between gap-4">
        <span className={cn("inline-flex rounded-full border px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide", chip.className)}>
          {chip.label}
        </span>
        <ExamStatus exam={exam} />
      </div>

      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-200" aria-hidden>
          <ClipboardList className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-xl font-semibold tracking-tight text-white">{exam.title}</h3>
          <p className="mt-1 truncate text-sm text-slate-400">
            {exam.subject} · {exam.className}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
          <div className="inline-flex items-center gap-2">
            <FileQuestion className="h-4 w-4 text-slate-500" aria-hidden />
            <dt className="sr-only">Questions</dt>
            <dd>{exam.questionCount} questions</dd>
          </div>
          <div className="inline-flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-slate-500" aria-hidden />
            <dt className="sr-only">Duration</dt>
            <dd>{exam.durationMinutes} min</dd>
          </div>
          {exam.startLabel ? (
            <div className="inline-flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-slate-500" aria-hidden />
              <dt className="sr-only">Window</dt>
              <dd>
                {exam.startLabel}
                {exam.endLabel ? ` – ${exam.endLabel}` : ""}
              </dd>
            </div>
          ) : null}
        </dl>
        <div className="shrink-0">
          <ExamAction exam={exam} />
        </div>
      </div>
    </article>
  );
}

const AUTO_ADVANCE_MS = 6000;
const SWIPE_THRESHOLD_PX = 48;

export function UpcomingExamCarousel({ exams }: { exams: DashboardExam[] }) {
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const swipeStartX = useRef<number | null>(null);
  const total = exams.length;
  const multiple = total > 1;
  const current = Math.min(active, total - 1);
  const paused = hovered || focused;

  useEffect(() => {
    if (!multiple || paused) return;
    const timer = window.setInterval(() => {
      if (document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      setActive((index) => (index + 1) % total);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [multiple, paused, total, current]);

  function go(index: number) {
    setActive(((index % total) + total) % total);
  }

  function onPointerDown(event: React.PointerEvent) {
    if (!multiple || event.pointerType === "mouse") return;
    swipeStartX.current = event.clientX;
  }

  function onPointerUp(event: React.PointerEvent) {
    if (swipeStartX.current === null) return;
    const delta = event.clientX - swipeStartX.current;
    swipeStartX.current = null;
    if (Math.abs(delta) >= SWIPE_THRESHOLD_PX) go(current + (delta < 0 ? 1 : -1));
  }

  const arrowClass =
    "hidden h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-slate-300 transition-[border-color,color,background-color,scale] duration-200 hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 sm:grid";

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Upcoming exams"
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <div className="flex items-center gap-3">
        {multiple ? (
          <button type="button" onClick={() => go(current - 1)} aria-label="Previous exam" className={arrowClass}>
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
        <div
          className="min-w-0 flex-1 overflow-hidden rounded-2xl touch-pan-y"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            swipeStartX.current = null;
          }}
        >
          <div
            aria-live={paused || !multiple ? "polite" : "off"}
            className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-reduce:transition-none"
            style={{ transform: `translate3d(-${current * 100}%, 0, 0)` }}
          >
            {exams.map((exam, index) => (
              <div
                key={exam.assignmentId}
                inert={index !== current}
                className={cn(
                  "w-full shrink-0 transition-[opacity,scale] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                  index === current ? "scale-100 opacity-100" : "scale-[0.97] opacity-40",
                )}
              >
                <ExamSlide exam={exam} index={index} total={total} />
              </div>
            ))}
          </div>
        </div>
        {multiple ? (
          <button type="button" onClick={() => go(current + 1)} aria-label="Next exam" className={arrowClass}>
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
      </div>
      {multiple ? (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => go(current - 1)}
            aria-label="Previous exam"
            className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-slate-300 transition-colors hover:text-white sm:hidden"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <div className="flex gap-2">
            {exams.map((exam, index) => (
              <button
                key={exam.assignmentId}
                type="button"
                onClick={() => go(index)}
                aria-label={`Show exam ${index + 1} of ${total}`}
                aria-current={index === current ? "true" : undefined}
                className={cn(
                  "h-2 rounded-full transition-[width,background-color] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60",
                  index === current ? "w-6 bg-violet-400" : "w-2 bg-white/20 hover:bg-white/40",
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(current + 1)}
            aria-label="Next exam"
            className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-slate-300 transition-colors hover:text-white sm:hidden"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}
