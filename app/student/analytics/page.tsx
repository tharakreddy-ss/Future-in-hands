import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { examImprovement, studentService } from "@/services/student.service";
import { PageHeader } from "@/components/layout/skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { PerformanceChart } from "@/components/students/performance-chart";
import { ScoreBars } from "@/components/analytics/score-bars";
import { EmptyState } from "@/components/layout/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatPercent } from "@/lib/utils";
import type { StudentProfile } from "@/components/students/types";

/** Same cutoffs as studentService.profile(): Good/Excellent start at 75%. */
function subjectsByStrength(subjects: StudentProfile["subjects"]) {
  return {
    strong: subjects.filter((subject) => subject.average >= 75),
    weak: subjects.filter((subject) => subject.average < 75),
  };
}

function statusTone(status: string) {
  if (status === "Excellent") return "green" as const;
  if (status === "Good") return "teal" as const;
  if (status === "Average") return "amber" as const;
  return "red" as const;
}

function improvementDisplay(delta: number, comparable: boolean) {
  if (!comparable) {
    return { value: "—", hint: "Needs 10 submitted exams (last 5 vs previous 5)" };
  }
  if (delta > 0) return { value: `+${delta}%`, hint: "Last 5 exams vs previous 5" };
  if (delta < 0) return { value: `${delta}%`, hint: "Last 5 exams vs previous 5" };
  return { value: "0%", hint: "Last 5 exams vs previous 5 · no change" };
}

export default async function StudentAnalyticsPage() {
  const user = await requireSession(["STUDENT"]);
  if (!user.studentId) notFound();
  const profile = (await studentService.profile(user.studentId)) as StudentProfile | null;
  if (!profile) notFound();

  const hasExams = profile.metrics.attempted > 0;
  const { delta, comparable } = examImprovement(profile.series.map((row) => row.percentage));
  const improvement = improvementDisplay(delta, comparable);
  const { strong, weak } = subjectsByStrength(profile.subjects);
  const rank = profile.metrics.rank;
  const showRank = Boolean(rank && rank.position > 0 && rank.of > 0);

  return (
    <div>
      <PageHeader
        title="My analytics"
        subtitle="Your submitted exam scores, subject performance, and how you are tracking over time."
      />
      {!hasExams ? (
        <div className="mt-6">
          <EmptyState
            title="No submitted exams yet"
            description="Analytics appear after you complete a scheduled exam. Nothing is estimated before then."
            actionHref="/student/tests"
            actionLabel="View exams"
          />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <div className={`grid gap-4 sm:grid-cols-2 ${showRank ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
            <StatCard
              label="Total Exams"
              value={profile.metrics.attempted}
              hint={profile.metrics.attempted === 1 ? "1 submitted exam" : "Submitted exams"}
            />
            <StatCard
              label="Average Score"
              value={formatPercent(profile.metrics.averageScore)}
              hint="Across all submitted exams"
            />
            <StatCard
              label="Highest Score"
              value={formatPercent(profile.metrics.highestScore)}
              hint="Best submitted percentage"
            />
            <StatCard label="Improvement" value={improvement.value} hint={improvement.hint} />
            {showRank && rank ? (
              <StatCard
                label="Rank"
                value={`${rank.position} / ${rank.of}`}
                hint="Class rank by average score"
              />
            ) : null}
          </div>

          <Card>
            <h2 className="text-lg font-semibold text-white">Insights</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{profile.insights.summary}</p>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-white">Score trend</h2>
            <p className="mt-1 text-sm text-slate-400">
              Each point is a submitted exam: name, date, and percentage. Hover a point for details.
            </p>
            <div className="mt-4">
              <PerformanceChart series={profile.series} />
            </div>
            <ul className="mt-6 divide-y divide-white/8 border-t border-white/8">
              {profile.history.map((row) => (
                <li key={row.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-white">{row.examName}</p>
                    <p className="text-xs text-slate-500">
                      {row.subject || "—"} · {formatDate(row.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-slate-400">
                      {row.score}/{row.total}
                    </span>
                    <span className="font-semibold text-violet-300">{formatPercent(row.percentage)}</span>
                    <Link href={`/student/results/${row.id}`} className="text-xs text-violet-300 hover:text-white">
                      Result
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <h2 className="text-lg font-semibold text-white">Strong subjects</h2>
              <p className="mt-1 text-sm text-slate-400">Average 75% or higher (Good or Excellent).</p>
              {strong.length ? (
                <ul className="mt-4 space-y-2">
                  {strong.map((subject) => (
                    <li
                      key={subject.name}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-sm"
                    >
                      <span className="text-white">{subject.name}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-slate-400">{formatPercent(subject.average)}</span>
                        <Badge tone={statusTone(subject.status)}>{subject.status}</Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  No subject is at 75% yet. Keep taking exams to build a strong-subject list.
                </p>
              )}
            </Card>
            <Card>
              <h2 className="text-lg font-semibold text-white">Weak subjects</h2>
              <p className="mt-1 text-sm text-slate-400">Average below 75%.</p>
              {weak.length ? (
                <ul className="mt-4 space-y-2">
                  {weak.map((subject) => (
                    <li
                      key={subject.name}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-sm"
                    >
                      <span className="text-white">{subject.name}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-slate-400">{formatPercent(subject.average)}</span>
                        <Badge tone={statusTone(subject.status)}>{subject.status}</Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  No subject is below 75% on your submitted exams.
                </p>
              )}
            </Card>
          </div>

          {profile.subjects.length > 0 ? (
            <Card>
              <h2 className="text-lg font-semibold text-white">Subject performance</h2>
              <p className="mt-1 text-sm text-slate-400">
                Average percentage by class subject, with how many submitted exams count toward each bar.
              </p>
              <div className="mt-4">
                <ScoreBars
                  items={profile.subjects.map((subject) => ({
                    label: `${subject.name} · ${subject.attempts} ${subject.attempts === 1 ? "exam" : "exams"} · ${subject.status}`,
                    value: subject.average,
                  }))}
                />
              </div>
            </Card>
          ) : (
            <Card>
              <h2 className="text-lg font-semibold text-white">Subject performance</h2>
              <p className="mt-3 text-sm text-slate-500">Subject averages appear once exams are tagged to a class subject.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
