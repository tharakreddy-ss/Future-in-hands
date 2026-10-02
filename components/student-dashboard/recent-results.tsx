import Link from "next/link";
import { ArrowRight, FileCheck } from "lucide-react";
import { Panel, PanelEmpty } from "@/components/student-dashboard/section";
import { formatDate, formatPercent } from "@/lib/utils";
import type { StudentDashboardData } from "@/services/student-dashboard.service";

function scoreTone(percentage: number) {
  if (percentage >= 70) return "text-emerald-300";
  if (percentage >= 40) return "text-amber-300";
  return "text-rose-300";
}

export function RecentResults({ results }: { results: StudentDashboardData["stats"]["recentResults"] }) {
  if (results.length === 0) {
    return (
      <Panel>
        <PanelEmpty icon={<FileCheck className="h-5 w-5" />} title="No results yet" description="Your submitted exams and scores will be listed here." />
      </Panel>
    );
  }
  return (
    <Panel>
      <ul className="divide-y divide-white/[0.05]">
        {results.map((row) => (
          <li key={row.id}>
            <Link
              href={`/student/results/${row.id}`}
              className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.025] focus-visible:bg-white/[0.04] focus-visible:outline-none sm:px-6"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-white">{row.title}</span>
                <span className="block text-xs text-slate-500">
                  {formatDate(row.submittedAt)} · {row.score}/{row.totalQuestions} correct
                </span>
              </span>
              <span className={`w-16 shrink-0 text-right text-base font-semibold tabular-nums ${scoreTone(row.percentage)}`}>
                {formatPercent(row.percentage)}
              </span>
              <span className="hidden shrink-0 items-center gap-1 text-xs font-medium text-violet-300 group-hover:text-white sm:inline-flex">
                View
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
