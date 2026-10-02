import { Flame, Trophy } from "lucide-react";
import { StudentAvatar } from "@/components/students/student-avatar";
import { Panel, PanelEmpty, RoundAvatar } from "@/components/student-dashboard/section";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry, StudentGamificationSummary } from "@/services/gamification.service";

const MEDALS: Record<number, { emoji: string; row: string; label: string }> = {
  1: { emoji: "🥇", row: "bg-amber-400/[0.07] shadow-[inset_3px_0_0_rgba(251,191,36,0.8)]", label: "Gold" },
  2: { emoji: "🥈", row: "bg-slate-300/[0.05] shadow-[inset_3px_0_0_rgba(203,213,225,0.7)]", label: "Silver" },
  3: { emoji: "🥉", row: "bg-orange-400/[0.06] shadow-[inset_3px_0_0_rgba(251,146,60,0.75)]", label: "Bronze" },
};

function streakText(streak: number) {
  return `${streak} ${streak === 1 ? "day" : "days"}`;
}

function LeaderboardRow({ row }: { row: LeaderboardEntry }) {
  const medal = row.points > 0 ? MEDALS[row.rank] : undefined;
  return (
    <li
      aria-current={row.isCurrentStudent ? "true" : undefined}
      className={cn(
        "grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 sm:grid-cols-[3.5rem_minmax(0,1fr)_7rem_6.5rem] sm:px-6",
        medal?.row,
        row.isCurrentStudent && "bg-violet-500/[0.14] shadow-[inset_3px_0_0_#a78bfa]",
      )}
    >
      <span className="text-center text-base font-semibold text-slate-400 tabular-nums">
        {medal ? (
          <span className="text-2xl leading-none" role="img" aria-label={`${medal.label}, rank ${row.rank}`}>
            {medal.emoji}
          </span>
        ) : (
          row.rank
        )}
      </span>
      <span className="flex min-w-0 items-center gap-3">
        <RoundAvatar>
          <StudentAvatar name={row.name} photoUrl={row.photoUrl} size={medal ? "md" : "sm"} />
        </RoundAvatar>
        <span className="min-w-0">
          <span className={cn("block truncate text-sm", row.isCurrentStudent || medal ? "font-semibold text-white" : "text-slate-200")}>
            {row.name}
            {row.isCurrentStudent ? <span className="ml-1.5 rounded-full bg-violet-500/25 px-1.5 py-px text-[10px] font-semibold uppercase text-violet-100">You</span> : null}
          </span>
          <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-500 sm:hidden">
            <Flame className="h-3 w-3 text-orange-300" aria-hidden />
            {streakText(row.streak)}
          </span>
        </span>
      </span>
      <span className="text-right text-sm font-semibold text-white tabular-nums sm:order-last sm:text-right">
        {row.points} <span className="text-[10px] font-medium uppercase text-slate-500">pts</span>
      </span>
      <span className="hidden items-center gap-1.5 text-sm text-slate-400 sm:inline-flex">
        <Flame className="h-4 w-4 text-orange-300" aria-hidden />
        {streakText(row.streak)}
      </span>
    </li>
  );
}

export function StudentLeaderboard({ summary }: { summary: StudentGamificationSummary }) {
  const rows = summary.leaderboard;
  const me = rows.find((row) => row.isCurrentStudent);

  if (rows.length === 0) {
    return (
      <Panel>
        <PanelEmpty
          icon={<Trophy className="h-5 w-5" />}
          title="No class leaderboard yet"
          description="You'll be ranked against your classmates once your institution enrols you in a class."
        />
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      {me ? (
        <section aria-label="Your position" className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl border border-violet-400/25 bg-violet-500/[0.08] px-6 py-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200">Your position</p>
            <p className="mt-1 text-3xl font-semibold text-white tabular-nums">#{me.rank}</p>
          </div>
          <div className="flex items-center gap-3">
            <RoundAvatar>
              <StudentAvatar name={me.name} photoUrl={me.photoUrl} size="md" />
            </RoundAvatar>
            <div>
              <p className="text-sm font-semibold text-white">{me.name}</p>
              <p className="text-xs text-slate-400">
                <span className="tabular-nums">{me.points}</span> points · 🔥 {streakText(me.streak)} streak
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-300 sm:ml-auto">
            {me.rank === 1
              ? me.points > 0
                ? "You're leading your class."
                : "Earn your first points to take the lead."
              : `${summary.pointsToNextRank} ${summary.pointsToNextRank === 1 ? "point" : "points"} to reach #${summary.nextRank}`}
          </p>
        </section>
      ) : null}

      <Panel className="overflow-hidden">
        <div className="hidden grid-cols-[3.5rem_minmax(0,1fr)_7rem_6.5rem] gap-3 border-b border-white/[0.06] px-6 py-3 text-[11px] font-medium uppercase tracking-wide text-slate-500 sm:grid">
          <span className="text-center">Rank</span>
          <span>Student</span>
          <span>Streak</span>
          <span className="text-right">Points</span>
        </div>
        <ol className="divide-y divide-white/[0.05]">
          {rows.map((row) => (
            <LeaderboardRow key={row.studentId} row={row} />
          ))}
        </ol>
      </Panel>

      <p className="text-xs leading-5 text-slate-500">
        Ranked by total points. Ties go to the higher active streak, then to whoever reached their score first. Only active students in
        your current class are shown.
      </p>
    </div>
  );
}
