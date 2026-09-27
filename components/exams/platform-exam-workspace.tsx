"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Activity, CalendarDays, CheckCircle2, ClipboardList, Search, Users } from "lucide-react";
import { EmptyState } from "@/components/layout/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type PlatformExamRow = {
  id: string;
  title: string;
  institution: string;
  classroom: string;
  state: "LIVE" | "UPCOMING" | "CLOSED" | "DRAFT";
  statusLabel: string;
  startAt: string | null;
  durationMinutes: number;
  questionCount: number;
  assignments: number;
  started: number;
  submitted: number;
};

const FILTERS = [
  { id: "ALL", label: "All exams" },
  { id: "LIVE", label: "Live" },
  { id: "UPCOMING", label: "Upcoming" },
  { id: "CLOSED", label: "Closed" },
  { id: "DRAFT", label: "Drafts" },
] as const;

function formatWhen(value: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function StateBadge({ state, label }: { state: PlatformExamRow["state"]; label: string }) {
  const tone = {
    LIVE: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
    UPCOMING: "border-violet-400/20 bg-violet-400/10 text-violet-200",
    CLOSED: "border-white/10 bg-white/5 text-slate-300",
    DRAFT: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  }[state];

  return <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-semibold", tone)}>{label}</span>;
}

export function PlatformExamWorkspace({ exams }: { exams: PlatformExamRow[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("ALL");
  const [query, setQuery] = useState("");

  const counts = useMemo(
    () => ({
      ALL: exams.length,
      LIVE: exams.filter((exam) => exam.state === "LIVE").length,
      UPCOMING: exams.filter((exam) => exam.state === "UPCOMING").length,
      CLOSED: exams.filter((exam) => exam.state === "CLOSED").length,
      DRAFT: exams.filter((exam) => exam.state === "DRAFT").length,
    }),
    [exams],
  );

  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return exams.filter((exam) => {
      const matchesFilter = filter === "ALL" || exam.state === filter;
      const matchesQuery =
        !normalized ||
        `${exam.title} ${exam.institution} ${exam.classroom}`.toLocaleLowerCase().includes(normalized);
      return matchesFilter && matchesQuery;
    });
  }, [exams, filter, query]);

  const liveCount = counts.LIVE;
  const assignedCount = exams.reduce((sum, exam) => sum + exam.assignments, 0);
  const submittedCount = exams.reduce((sum, exam) => sum + exam.submitted, 0);
  const completionRate = assignedCount ? Math.round((submittedCount / assignedCount) * 100) : 0;

  return (
    <div>
      <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total exams" value={exams.length} hint="Across all institutions" />
        <StatCard label="Live right now" value={liveCount} hint="Open exam windows" />
        <StatCard label="Students assigned" value={assignedCount} hint={`${submittedCount} submissions received`} />
        <StatCard label="Completion" value={`${completionRate}%`} hint="Submissions / assignments" />
      </div>

      <section className="mt-9" aria-labelledby="exam-list-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="exam-list-heading" className="text-lg font-semibold text-white">Exam activity</h2>
            <p className="mt-1 text-sm text-slate-500">Find an exam by name, institution, or class.</p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
            <Input
              aria-label="Search exams"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search exams…"
              className="pl-9"
            />
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter exams by status">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition",
                filter === item.id
                  ? "bg-gradient-to-r from-[#7C3AED] to-[#4F6BFF] text-white shadow-[0_6px_24px_rgba(99,102,241,0.24)]"
                  : "border border-white/8 bg-white/[0.035] text-slate-400 hover:bg-white/[0.07] hover:text-white",
              )}
            >
              {item.label}
              <span className={cn("text-xs", filter === item.id ? "text-white/75" : "text-slate-500")}>
                {counts[item.id]}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {visible.length === 0 ? (
            exams.length === 0 ? (
              <EmptyState
                title="No exams to monitor yet"
                description="Once an institution schedules an exam, its status and student activity will appear here."
                actionHref="/super-admin/institutions"
                actionLabel="View Institutions"
              />
            ) : (
              <EmptyState
                title="No matching exams"
                description="Try a different search or status filter to find the exam you need."
                actionHref="/super-admin/exams"
                actionLabel="View All Exams"
              />
            )
          ) : (
            visible.map((exam) => {
              const progress = exam.assignments ? Math.round((exam.submitted / exam.assignments) * 100) : 0;
              return (
                <Card key={exam.id} className="p-4 sm:p-5">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="truncate text-base font-semibold text-white sm:text-lg">{exam.title}</h3>
                        <StateBadge state={exam.state} label={exam.statusLabel} />
                      </div>
                      <p className="mt-1.5 text-sm text-slate-400">{exam.institution} <span className="px-1 text-slate-600">/</span> {exam.classroom}</p>

                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" aria-hidden />{formatWhen(exam.startAt)}</span>
                        <span className="inline-flex items-center gap-1.5"><ClipboardList className="h-3.5 w-3.5" aria-hidden />{exam.questionCount} questions · {exam.durationMinutes} min</span>
                        <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" aria-hidden />{exam.assignments} assigned · {exam.started} started</span>
                      </div>
                    </div>

                    <div className="w-full lg:w-56">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Submission progress</span>
                        <span className="font-medium text-slate-300">{exam.submitted}/{exam.assignments}</span>
                      </div>
                      <div
                        className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8"
                        role="progressbar"
                        aria-label={`${exam.title} submissions`}
                        aria-valuemin={0}
                        aria-valuemax={exam.assignments || 1}
                        aria-valuenow={exam.submitted}
                      >
                        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-400 transition-[width] duration-700" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="mt-1.5 text-right text-[11px] text-slate-500">{progress}% complete</p>
                    </div>

                    <div className="flex shrink-0 gap-2 lg:pl-2">
                      <Link href={`/super-admin/exams/${exam.id}`} className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10">
                        Details
                      </Link>
                      <Link href={`/super-admin/exams/${exam.id}/monitor`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F6BFF] px-3.5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(79,107,255,0.2)]">
                        <Activity className="h-4 w-4" aria-hidden />Monitor
                      </Link>
                    </div>
                  </div>
                  <span className="sr-only"><CheckCircle2 aria-hidden /> {progress} percent of assigned students have submitted.</span>
                </Card>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
