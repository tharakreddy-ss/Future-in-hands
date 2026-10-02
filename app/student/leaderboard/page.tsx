import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Trophy } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { getStudentGamificationSummary } from "@/services/student-dashboard.service";
import { PageFade } from "@/components/motion/page-fade";
import { StudentLeaderboard } from "@/components/student-dashboard/student-leaderboard";

export default async function StudentLeaderboardPage() {
  const user = await requireSession(["STUDENT"]);
  if (!user.studentId) notFound();
  const summary = await getStudentGamificationSummary(user.studentId);
  const cls = summary.currentClass;

  return (
    <PageFade>
      <div className="mx-auto max-w-3xl">
        <Link
          href="/student/dashboard"
          className="inline-flex items-center gap-1 rounded-md text-sm text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Back
        </Link>

        <header className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-400/15 text-amber-200" aria-hidden>
              <Trophy className="h-7 w-7" strokeWidth={1.75} />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">Class Leaderboard</h1>
              {cls ? (
                <p className="mt-0.5 text-sm text-slate-400">
                  {[cls.name, cls.section].filter(Boolean).join(" · ")}
                  <span className="mx-1.5 text-slate-600">·</span>
                  {summary.classSize} active {summary.classSize === 1 ? "student" : "students"}
                </p>
              ) : (
                <p className="mt-0.5 text-sm text-slate-400">You are not enrolled in a class yet</p>
              )}
            </div>
          </div>
          <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300">Overall ranking</span>
        </header>

        <div className="mt-8">
          <StudentLeaderboard summary={summary} />
        </div>
      </div>
    </PageFade>
  );
}
