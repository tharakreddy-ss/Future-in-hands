import { requireSession } from "@/lib/auth";
import { studentService } from "@/services/student.service";
import { PageHeader } from "@/components/layout/skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { PerformanceChart } from "@/components/students/performance-chart";
import { ScoreBars } from "@/components/analytics/score-bars";
import { EmptyState } from "@/components/layout/empty-state";
import { Card } from "@/components/ui/card";
import { formatPercent } from "@/lib/utils";
import { notFound } from "next/navigation";
import type { StudentProfile } from "@/components/students/types";

/** Same last-5 vs previous-5 delta as studentService.profile(). */
function improvementDelta(series: StudentProfile["series"]) {
  const scores = series.map((row) => row.percentage);
  const lastFive = scores.slice(-5);
  const prior = scores.slice(-10, -5);
  const lastAvg = lastFive.length ? lastFive.reduce((a, b) => a + b, 0) / lastFive.length : 0;
  const priorAvg = prior.length ? prior.reduce((a, b) => a + b, 0) / prior.length : lastAvg;
  return Math.round(lastAvg - priorAvg);
}

function improvementLabel(delta: number) {
  if (delta > 0) return `+${delta}%`;
  return `${delta}%`;
}

export default async function StudentAnalyticsPage() {
  const user = await requireSession(["STUDENT"]);
  if (!user.studentId) notFound();
  const profile = (await studentService.profile(user.studentId)) as StudentProfile | null;
  if (!profile) notFound();

  const hasExams = profile.metrics.attempted > 0;
  const delta = improvementDelta(profile.series);
  const rank = profile.metrics.rank;

  return (
    <div>
      <PageHeader title="My analytics" subtitle="Strengths, weak topics, and score trend." />
      {!hasExams ? (
        <div className="mt-6">
          <EmptyState
            title="No results yet"
            description="Complete a scheduled exam to see your average, trend, rank, and subject performance here."
            actionHref="/student/tests"
            actionLabel="View exams"
          />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Total Exams" value={profile.metrics.attempted} />
            <StatCard label="Average Score" value={formatPercent(profile.metrics.averageScore)} />
            <StatCard label="Highest Score" value={formatPercent(profile.metrics.highestScore)} />
            <StatCard
              label="Improvement"
              value={improvementLabel(delta)}
              hint="Last 5 tests vs previous 5"
            />
            <StatCard
              label="Rank"
              value={rank ? `${rank.position} / ${rank.of}` : "—"}
              hint={rank ? "In your class by average score" : "Join a class to see rank"}
            />
          </div>

          <Card className="mt-6">
            <h2 className="text-lg font-semibold text-white">Score trend</h2>
            <p className="mt-1 text-sm text-slate-400">Your submitted exam scores over time.</p>
            <div className="mt-4">
              <PerformanceChart series={profile.series} />
            </div>
          </Card>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Card>
              <h2 className="text-lg font-semibold text-white">Strong subjects</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {profile.insights.strengths.map((name) => (
                  <li key={name} className="rounded-xl border border-white/8 bg-white/5 px-3 py-2">
                    {name}
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <h2 className="text-lg font-semibold text-white">Weak subjects</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {profile.insights.weak.map((name) => (
                  <li key={name} className="rounded-xl border border-white/8 bg-white/5 px-3 py-2">
                    {name}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {profile.subjects.length > 0 ? (
            <Card className="mt-6">
              <h2 className="text-lg font-semibold text-white">Subject performance</h2>
              <p className="mt-1 text-sm text-slate-400">Average score by class subject.</p>
              <div className="mt-4">
                <ScoreBars
                  items={profile.subjects.map((subject) => ({
                    label: `${subject.name} · ${subject.status}`,
                    value: subject.average,
                  }))}
                />
              </div>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
