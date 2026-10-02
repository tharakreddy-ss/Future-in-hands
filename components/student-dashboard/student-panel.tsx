import Link from "next/link";
import { CalendarDays, Check, ChevronRight, ClipboardCheck, Flame, Medal, Percent, Star, Target, Trophy } from "lucide-react";
import { StudentAvatar } from "@/components/students/student-avatar";
import { RoundAvatar } from "@/components/student-dashboard/section";
import { cn } from "@/lib/utils";
import type { StudentGamificationSummary } from "@/services/gamification.service";
import type { ScheduleDay, StudentDashboardData } from "@/services/student-dashboard.service";

const MEDALS = ["text-amber-300", "text-slate-300", "text-orange-300"];
const PREVIEW_SIZE = 3;

const linkReset =
  "rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60";

function Block({ id, title, action, children }: { id: string; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="px-5 py-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id={id} className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Bar({ value, max, label, className }: { value: number; max: number; label: string; className?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
    >
      <div className={cn("h-full rounded-full transition-[width] duration-500 ease-out", className)} style={{ width: `${pct}%` }} />
    </div>
  );
}

function Ring({ pct, children }: { pct: number; children: React.ReactNode }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  return (
    <span className="relative grid h-14 w-14 shrink-0 place-items-center">
      <svg viewBox="0 0 52 52" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="26" cy="26" r={radius} fill="none" strokeWidth="5" className="stroke-white/[0.07]" />
        <circle
          cx="26"
          cy="26"
          r={radius}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          className="stroke-emerald-400 transition-[stroke-dashoffset] duration-700 ease-out"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct / 100)}
        />
      </svg>
      <span className="text-xs font-semibold text-white tabular-nums">{children}</span>
    </span>
  );
}

function GoalLine({ done, label, reward }: { done: boolean; label: string; reward: string }) {
  return (
    <li className="flex items-center gap-2 text-xs">
      <span
        className={cn(
          "grid h-4 w-4 shrink-0 place-items-center rounded-full border",
          done ? "border-emerald-400 bg-emerald-400 text-[#0b1122]" : "border-white/20",
        )}
        aria-hidden
      >
        {done ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
      </span>
      <span className={cn("min-w-0 flex-1 leading-snug", done ? "text-slate-400 line-through decoration-slate-600" : "text-slate-200")}>{label}</span>
      <span className="shrink-0 font-medium text-amber-200">{reward}</span>
    </li>
  );
}

function ProgressTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] px-3 py-2.5 transition-colors hover:bg-white/[0.05]">
      <dt className="flex items-center gap-1.5 text-[11px] text-slate-500">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-base font-semibold text-white tabular-nums">{value}</dd>
    </div>
  );
}

const days = (n: number) => `${n} ${n === 1 ? "day" : "days"}`;

export function StudentPanel({
  name,
  photoUrl,
  todayLabel,
  summary,
  goals,
  lastSevenDays,
  stats,
  practiceAccuracy,
}: {
  name: string;
  photoUrl: string | null;
  todayLabel: string;
  summary: StudentGamificationSummary;
  goals: StudentDashboardData["goals"];
  lastSevenDays: ScheduleDay[];
  stats: { attempted: number; averageScore: number };
  practiceAccuracy: number | null;
}) {
  const { daily, weekly } = goals;
  const dailyDone = (daily.activityDone ? 1 : 0) + daily.practiceRewarded;
  const dailyTotal = 1 + daily.practiceCap;
  const dailyPct = Math.round((dailyDone / dailyTotal) * 100);
  const activeDays = lastSevenDays.filter((day) => day.active).length;

  const preview = summary.leaderboard.slice(0, PREVIEW_SIZE);
  const me = summary.leaderboard.find((row) => row.isCurrentStudent);
  if (me && !preview.some((row) => row.isCurrentStudent)) preview.push(me);

  return (
    <div className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-[#101831] to-[#0c1325]">
      <div className="flex items-center gap-3 px-5 py-5">
        <RoundAvatar>
          <StudentAvatar name={name} photoUrl={photoUrl} size="md" />
        </RoundAvatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-white">{name}</p>
          <Link
            href="/student/leaderboard"
            className={cn(linkReset, "group mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-violet-300 hover:text-white")}
          >
            Daily Rank
            <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
          </Link>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
            <CalendarDays className="h-3 w-3" aria-hidden />
            {todayLabel}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 px-5 py-4">
        <div className="rounded-xl border border-violet-400/15 bg-violet-500/[0.08] px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[11px] text-violet-200/80">
            <Star className="h-3.5 w-3.5" aria-hidden />
            Points
          </p>
          <p className="mt-0.5 text-xl font-semibold text-white tabular-nums">{summary.totalPoints}</p>
        </div>
        <div className="rounded-xl border border-orange-400/15 bg-orange-500/[0.08] px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[11px] text-orange-200/80">
            <Flame className="h-3.5 w-3.5" aria-hidden />
            Streak
          </p>
          <p className="mt-0.5 text-xl font-semibold text-white tabular-nums">{days(summary.currentStreak)}</p>
        </div>
      </div>

      <Block
        id="daily-goal"
        title="Daily Goal"
        action={
          daily.completed ? (
            <span className="text-[11px] font-medium text-emerald-300">Completed</span>
          ) : daily.activityResetsInHours ? (
            <span className="text-[11px] text-slate-500">Resets in {daily.activityResetsInHours}h</span>
          ) : null
        }
      >
        <div className="flex items-center gap-4">
          <Ring pct={dailyPct}>
            {dailyDone}/{dailyTotal}
          </Ring>
          <ul className="min-w-0 flex-1 space-y-2">
            <GoalLine done={daily.activityDone} label="Practice or exam" reward={`+${daily.activityReward}`} />
            <GoalLine
              done={daily.practiceRewarded >= daily.practiceCap}
              label={`Quizzes ${daily.practiceRewarded}/${daily.practiceCap}`}
              reward={`+${daily.practiceReward} each`}
            />
          </ul>
        </div>
        <p className="mt-3 text-[11px] text-slate-500">Rewards reset on a rolling 24-hour window.</p>
      </Block>

      <Block
        id="weekly-goal"
        title="Weekly Goal"
        action={<span className="text-[11px] text-slate-500 tabular-nums">{activeDays}/7 active days</span>}
      >
        <ol className="grid grid-cols-7 gap-1" aria-label="Activity over the last 7 days">
          {lastSevenDays.map((day) => (
            <li key={day.key} className="flex flex-col items-center gap-1">
              <span aria-hidden className={cn("text-[10px]", day.isToday ? "font-semibold text-violet-200" : "text-slate-500")}>{day.weekday.slice(0, 1)}</span>
              <span
                className={cn(
                  "grid h-6 w-6 place-items-center rounded-full border text-[10px]",
                  day.active ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-200" : "border-white/10 text-slate-600",
                  day.isToday && !day.active && "border-violet-400/50",
                )}
              >
                {day.active ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden /> : null}
                <span className="sr-only">
                  {day.weekday} {day.day}: {day.active ? "active" : "no activity"}
                </span>
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-slate-300">
              {weekly.completed ? "All streak milestones reached" : `Reach a ${weekly.targetDays}-day streak`}
            </span>
            {weekly.completed ? null : <span className="font-medium text-amber-200">+{weekly.reward}</span>}
          </div>
          <Bar
            value={weekly.progressDays}
            max={weekly.targetDays}
            label={`Streak progress towards ${weekly.targetDays} days`}
            className="bg-gradient-to-r from-orange-400 to-amber-300"
          />
          <p className="mt-1.5 text-[11px] text-slate-500 tabular-nums">
            {Math.min(weekly.progressDays, weekly.targetDays)}/{weekly.targetDays} days
          </p>
        </div>
      </Block>

      <Block id="class-rank" title="Class Rank">
        <Link
          href="/student/leaderboard"
          className={cn(linkReset, "group -mx-2 flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-white/[0.04]")}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-400/15 text-amber-200" aria-hidden>
            <Trophy className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-white">{name}</span>
            <span className="block text-xs text-amber-200">
              {summary.rank ? `Class Rank #${summary.rank}` : "Not ranked yet"}
              {summary.rank && summary.classSize ? <span className="text-slate-500"> of {summary.classSize}</span> : null}
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-500 transition-[color,translate] duration-200 group-hover:translate-x-0.5 group-hover:text-white" aria-hidden />
        </Link>
        <p className="mt-2 text-[11px] text-slate-500">
          {summary.rank === 1
            ? "You're at the top of your class."
            : summary.pointsToNextRank && summary.nextRank
              ? `${summary.pointsToNextRank} pts to reach #${summary.nextRank}`
              : "Earn points to climb the class ranking."}
        </p>
      </Block>

      <Block id="your-progress" title="Your Progress">
        <dl className="grid grid-cols-2 gap-2">
          <ProgressTile icon={<Medal className="h-3 w-3 text-amber-300" aria-hidden />} label="Longest streak" value={days(summary.longestStreak)} />
          <ProgressTile icon={<ClipboardCheck className="h-3 w-3 text-sky-300" aria-hidden />} label="Tests attempted" value={String(stats.attempted)} />
          <ProgressTile
            icon={<Percent className="h-3 w-3 text-emerald-300" aria-hidden />}
            label="Average score"
            value={stats.attempted ? `${Math.round(stats.averageScore)}%` : "—"}
          />
          <ProgressTile
            icon={<Target className="h-3 w-3 text-violet-300" aria-hidden />}
            label="Practice accuracy"
            value={practiceAccuracy === null ? "—" : `${practiceAccuracy}%`}
          />
        </dl>
      </Block>

      <Block
        id="class-leaderboard"
        title="Class Leaderboard"
        action={
          <Link href="/student/leaderboard" className={cn(linkReset, "text-[11px] font-medium text-violet-300 hover:text-white")}>
            View all
          </Link>
        }
      >
        {preview.length ? (
          <ol className="space-y-1">
            {preview.map((row) => (
              <li
                key={row.studentId}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors",
                  row.isCurrentStudent ? "bg-violet-500/[0.12] ring-1 ring-inset ring-violet-400/20" : "hover:bg-white/[0.03]",
                )}
              >
                <span className="w-5 shrink-0 text-center text-xs font-semibold text-slate-400 tabular-nums">
                  {row.rank <= 3 && row.points > 0 ? <Medal className={cn("mx-auto h-4 w-4", MEDALS[row.rank - 1])} aria-label={`Rank ${row.rank}`} /> : row.rank}
                </span>
                <RoundAvatar>
                  <StudentAvatar name={row.name} photoUrl={row.photoUrl} size="sm" />
                </RoundAvatar>
                <span className="min-w-0 flex-1 truncate text-slate-200">
                  {row.name}
                  {row.isCurrentStudent ? <span className="ml-1 text-[10px] font-semibold uppercase text-violet-300">You</span> : null}
                </span>
                <span className="shrink-0 text-xs font-semibold text-white tabular-nums">{row.points}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-xs text-slate-500">No ranked classmates yet.</p>
        )}
      </Block>
    </div>
  );
}
