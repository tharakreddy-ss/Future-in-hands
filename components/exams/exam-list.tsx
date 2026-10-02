import { examWindow } from "@/lib/exam-window";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/layout/empty-state";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

function bucket(window: ReturnType<typeof examWindow>) {
  if (window === "LOCKED") return "upcoming";
  if (window === "LIVE") return "live";
  return "completed";
}

export function ExamList({
  exams,
  tab,
  basePath,
}: {
  exams: Awaited<ReturnType<typeof import("@/services/exam.service").examService.list>>;
  tab: string;
  basePath: string;
}) {
  const grouped = {
    upcoming: exams.filter((exam) => bucket(examWindow(exam)) === "upcoming"),
    live: exams.filter((exam) => bucket(examWindow(exam)) === "live"),
    completed: exams.filter((exam) => bucket(examWindow(exam)) === "completed"),
  };
  const rows = grouped[tab as keyof typeof grouped] ?? grouped.upcoming;

  return (
    <div>
      <div className="mt-6 flex flex-wrap gap-2">
        {(["upcoming", "live", "completed"] as const).map((item) => (
          <Link
            key={item}
            href={`${basePath}/exams?tab=${item}`}
            className={`rounded-full px-4 py-2 text-sm capitalize ${
              tab === item ? "bg-gradient-to-r from-[#7C3AED] to-[#4F6BFF] text-white" : "bg-white/5 text-slate-400"
            }`}
          >
            {item}
          </Link>
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {rows.length === 0 ? (
          <EmptyState
            title="No exams created yet."
            description="Open a classroom or a student report to create an exam."
          />
        ) : (
          rows.map((exam) => {
            const completed = exam.attempts.filter((row) => row.status === "SUBMITTED").length;
            const inProgress = exam.attempts.filter((row) => row.status === "IN_PROGRESS").length;
            const avg =
              completed === 0
                ? 0
                : exam.attempts.filter((row) => row.status === "SUBMITTED").reduce((sum, row) => sum + row.percentage, 0) /
                  completed;
            return (
              <Card key={exam.id} className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-white">{exam.title}</p>
                  <p className="text-sm text-slate-400">
                    {exam.class.name} · {exam._count.assignments} students ·{" "}
                    {exam.startAt ? formatDate(exam.startAt) : "Unscheduled"}
                  </p>
                  {tab === "live" ? (
                    <p className="mt-1 text-xs text-cyan-300">
                      In progress {inProgress} · Completed {completed}
                    </p>
                  ) : null}
                  {tab === "completed" ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Completed {completed}/{exam._count.assignments} · Avg {Math.round(avg)}%
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-2 text-sm">
                  <Link href={`${basePath}/exams/${exam.id}`} className="rounded-xl border border-white/10 px-3 py-2">
                    {tab === "upcoming" ? "Edit" : "View"}
                  </Link>
                  {tab === "live" ? (
                    <Link
                      href={`${basePath}/exams/${exam.id}/monitor`}
                      className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F6BFF] px-3 py-2 font-semibold"
                    >
                      Monitor Exam
                    </Link>
                  ) : null}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
