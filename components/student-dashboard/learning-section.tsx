import Link from "next/link";
import { ArrowRight, Flame, Target } from "lucide-react";
import { Panel } from "@/components/student-dashboard/section";
import type { StudentDashboardData } from "@/services/student-dashboard.service";

function relative(iso: string, now: number) {
  const minutes = Math.round((now - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tracking-tight text-white tabular-nums">{value}</dd>
      {hint ? <dd className="text-[11px] text-slate-500">{hint}</dd> : null}
    </div>
  );
}

export function LearningSection({
  progress,
  activity,
  currentStreak,
  streakHoursLeft,
  generatedAt,
}: {
  progress: StudentDashboardData["progress"];
  activity: StudentDashboardData["activity"];
  currentStreak: number;
  streakHoursLeft: number | null;
  generatedAt: number;
}) {
  const last = progress.lastPractice;
  const nextStep =
    currentStreak > 0 && streakHoursLeft
      ? `Complete a practice quiz within ${streakHoursLeft}h to keep your ${currentStreak}-day streak.`
      : "Complete a practice quiz or an exam to start your streak.";

  return (
    <Panel className="overflow-hidden">
      <div className="grid gap-8 p-6 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
        <div className="min-w-0">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-500/15 text-violet-200" aria-hidden>
            <Target className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <h3 className="mt-4 text-xl font-semibold tracking-tight text-white">Continue your practice</h3>
          <p className="mt-1.5 text-sm leading-6 text-slate-400">
            {last
              ? `Last practice ${relative(last.occurredAt, generatedAt)}${last.questions !== null && last.correct !== null ? ` · ${last.correct}/${last.questions} correct` : ""}.`
              : "You haven't completed a practice quiz in the last 7 days."}
          </p>
          <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-500">
            <Flame className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-300" aria-hidden />
            {nextStep}
          </p>
          <Link
            href="/student/practice"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70"
          >
            Continue practice
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="min-w-0 self-stretch rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 lg:flex lg:items-center">
          <dl className="grid w-full grid-cols-3 gap-4">
            <Stat
              label="Accuracy"
              value={progress.practiceAccuracyThisWeek === null ? "—" : `${progress.practiceAccuracyThisWeek}%`}
              hint="Last 7 days"
            />
            <Stat label="Quizzes" value={String(progress.practiceSessionsThisWeek)} hint={`${progress.practiceQuestionsThisWeek} questions`} />
            <Stat label="Points" value={String(progress.pointsThisWeek)} hint="Last 7 days" />
          </dl>
        </div>
      </div>

      {activity.length ? (
        <div className="border-t border-white/[0.06] px-6 py-4 sm:px-7">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Recent activity</p>
          <ul className="mt-2 divide-y divide-white/[0.04]">
            {activity.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 truncate">
                  <span className="text-slate-200">{item.label}</span>
                  <span className="text-slate-500">
                    {" · "}
                    {[item.detail, relative(item.occurredAt, generatedAt)].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className={item.points > 0 ? "shrink-0 text-xs font-semibold text-emerald-300" : "shrink-0 text-xs text-slate-500"}>
                  {item.points > 0 ? `+${item.points} pts` : "0 pts"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Panel>
  );
}
