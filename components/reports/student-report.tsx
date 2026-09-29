import { formatDateTime, statusClass } from "@/components/reports/format";
import { ReportSection } from "@/components/reports/report-section";
import { ScoreTrend } from "@/components/reports/score-trend";
import { initials } from "@/components/students/types";
import { cn, formatDate, formatPercent } from "@/lib/utils";
import type { StudentReport as StudentReportData } from "@/services/report.service";

function formatDuration(seconds: number | null) {
  if (seconds === null) return "—";
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes ? `${minutes}m ${rest.toString().padStart(2, "0")}s` : `${rest}s`;
}

function formatScore(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function buildInsights(report: StudentReportData) {
  const { metrics, history, subjects, insights, series } = report;
  const notes: string[] = [];
  if (metrics.attempted === 0) return notes;

  const strongest = [...subjects].sort((a, b) => b.average - a.average)[0];
  const weakest = [...subjects].sort((a, b) => a.average - b.average)[0];
  if (insights.strengths.length) {
    notes.push(`Strong areas (average 75% or higher): ${insights.strengths.join(", ")}.`);
  }
  if (insights.weak.length) {
    notes.push(`Needs attention (average below 75%): ${insights.weak.join(", ")}.`);
  }
  if (subjects.length > 1 && strongest && weakest && strongest.name !== weakest.name) {
    const gap = Math.round(strongest.average - weakest.average);
    if (gap >= 15) {
      notes.push(`There is a ${gap}-point gap between ${strongest.name} and ${weakest.name}.`);
    }
  }

  const spread = Math.round(metrics.highestScore - metrics.lowestScore);
  if (metrics.attempted >= 3 && spread >= 30) {
    notes.push(
      `Scores vary widely, from ${formatPercent(metrics.lowestScore)} to ${formatPercent(metrics.highestScore)}. Consistency could improve.`,
    );
  } else if (metrics.attempted >= 3 && spread <= 10) {
    notes.push(`Scores are consistent, staying within ${spread} points across ${metrics.attempted} exams.`);
  }

  const latest = series[series.length - 1];
  if (latest && metrics.attempted >= 3) {
    const diff = Math.round(latest.percentage - metrics.averageScore);
    if (diff >= 10) notes.push(`The most recent exam (${latest.examName}) was ${diff} points above the overall average.`);
    if (diff <= -10) {
      notes.push(`The most recent exam (${latest.examName}) was ${Math.abs(diff)} points below the overall average.`);
    }
  }

  const withCounts = history.filter((row) => row.unanswered !== null && row.total > 0);
  const totalQuestions = withCounts.reduce((sum, row) => sum + row.total, 0);
  const unanswered = withCounts.reduce((sum, row) => sum + (row.unanswered ?? 0), 0);
  if (totalQuestions > 0) {
    const rate = (unanswered / totalQuestions) * 100;
    if (rate >= 10) {
      notes.push(
        `${formatPercent(rate)} of questions were left unanswered (${unanswered} of ${totalQuestions}). Encourage attempting every question.`,
      );
    }
  }

  const answered = withCounts.reduce((sum, row) => sum + (row.correct ?? 0) + (row.wrong ?? 0), 0);
  const correct = withCounts.reduce((sum, row) => sum + (row.correct ?? 0), 0);
  if (answered > 0) {
    notes.push(`Accuracy on attempted questions: ${formatPercent((correct / answered) * 100)} (${correct} of ${answered}).`);
  }
  return notes;
}

export function StudentReport({ report }: { report: StudentReportData }) {
  const { student, metrics } = report;
  const hasAttempts = metrics.attempted > 0;
  const insights = buildInsights(report);

  const info: Array<[string, string | null]> = [
    ["Student ID", student.studentIdentifier],
    ["Roll number", student.rollNumber],
    ["Email", student.email],
    ["Phone", student.phone],
    ["Class", student.className],
    ["Section", student.section],
    ["Academic year", student.academicYear],
    ["Gender", student.gender],
    ["Date of birth", student.dateOfBirth ? formatDate(student.dateOfBirth) : null],
    [
      "Guardian",
      student.guardianName
        ? student.guardianPhone
          ? `${student.guardianName} (${student.guardianPhone})`
          : student.guardianName
        : student.guardianPhone,
    ],
    ["Status", student.status === "ACTIVE" ? "Active" : "Inactive"],
  ];

  const kpis: Array<[string, string]> = [
    ["Tests attempted", String(metrics.attempted)],
    ["Average score", hasAttempts ? formatPercent(metrics.averageScore) : "—"],
    ["Highest score", hasAttempts ? formatPercent(metrics.highestScore) : "—"],
    ["Lowest score", hasAttempts ? formatPercent(metrics.lowestScore) : "—"],
    ["Class rank", hasAttempts && metrics.rank ? `#${metrics.rank.position} of ${metrics.rank.of}` : "—"],
  ];

  return (
    <article className="mx-auto max-w-5xl space-y-8 rounded-2xl bg-white p-6 text-slate-900 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-10 print:max-w-none print:space-y-6 print:rounded-none print:p-0 print:shadow-none">
      <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-violet-700 pb-6">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-700">{report.institution}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Student Academic Report</h1>
          <p className="mt-3 text-xl font-semibold">{student.name}</p>
          <p className="mt-1 text-xs text-slate-500">Generated on {formatDate(report.generatedAt)}</p>
        </div>
        {student.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- tenant-scoped API route
          <img
            src={student.photoUrl}
            alt={student.name}
            className="h-24 w-24 rounded-xl border border-slate-200 object-cover"
          />
        ) : (
          <div className="grid h-24 w-24 place-items-center rounded-xl border border-slate-200 bg-slate-100 text-2xl font-semibold text-slate-500">
            {initials(student.name)}
          </div>
        )}
      </header>

      <ReportSection title="Student information">
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3">
          {info
            .filter((entry): entry is [string, string] => Boolean(entry[1]))
            .map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="truncate text-sm font-medium">{value}</dd>
              </div>
            ))}
        </dl>
      </ReportSection>

      <ReportSection title="Performance summary">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 print:grid-cols-5">
          {kpis.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-1 text-xl font-bold">{value}</p>
            </div>
          ))}
        </div>
      </ReportSection>

      <ReportSection title="Performance trend">
        <ScoreTrend series={report.series} />
      </ReportSection>

      <ReportSection title="Subject performance">
        {report.subjects.length === 0 ? (
          <p className="text-sm text-slate-500">No subject results yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="py-2 pr-4 font-medium">Subject</th>
                <th className="py-2 pr-4 font-medium">Exams</th>
                <th className="py-2 pr-4 font-medium">Average</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {report.subjects.map((subject) => (
                <tr key={subject.name} className="break-inside-avoid border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium">{subject.name}</td>
                  <td className="py-2 pr-4">{subject.attempts}</td>
                  <td className="py-2 pr-4">{formatPercent(subject.average)}</td>
                  <td className="py-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusClass(subject.status))}>
                      {subject.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ReportSection>

      <section>
        <h2 className="mb-3 border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-wider text-slate-600">
          Exam history
        </h2>
        {report.history.length === 0 ? (
          <p className="text-sm text-slate-500">No submitted exams yet.</p>
        ) : (
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full min-w-[900px] text-left text-xs print:min-w-0 print:text-[10px]">
              <thead className="uppercase text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="py-2 pr-3 font-medium">Exam</th>
                  <th className="py-2 pr-3 font-medium">Subject</th>
                  <th className="py-2 pr-3 font-medium">Submitted</th>
                  <th className="py-2 pr-3 text-right font-medium">Score</th>
                  <th className="py-2 pr-3 text-right font-medium">Total</th>
                  <th className="py-2 pr-3 text-right font-medium">%</th>
                  <th className="py-2 pr-3 text-right font-medium">Correct</th>
                  <th className="py-2 pr-3 text-right font-medium">Wrong</th>
                  <th className="py-2 pr-3 text-right font-medium">Unanswered</th>
                  <th className="py-2 pr-3 text-right font-medium">Time</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {report.history.map((row) => (
                  <tr key={row.id} className="break-inside-avoid border-b border-slate-100">
                    <td className="py-2 pr-3 font-medium">{row.examName}</td>
                    <td className="py-2 pr-3">{row.subject ?? "—"}</td>
                    <td className="whitespace-nowrap py-2 pr-3">{formatDateTime(row.date)}</td>
                    <td className="py-2 pr-3 text-right">{formatScore(row.score)}</td>
                    <td className="py-2 pr-3 text-right">{row.total}</td>
                    <td className="py-2 pr-3 text-right font-semibold">{formatPercent(row.percentage)}</td>
                    <td className="py-2 pr-3 text-right">{row.correct ?? "—"}</td>
                    <td className="py-2 pr-3 text-right">{row.wrong ?? "—"}</td>
                    <td className="py-2 pr-3 text-right">{row.unanswered ?? "—"}</td>
                    <td className="whitespace-nowrap py-2 pr-3 text-right">{formatDuration(row.timeTakenSeconds)}</td>
                    <td className="py-2">{row.status === "SUBMITTED" ? "Completed" : row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ReportSection title="Performance insights">
        <p className="text-sm leading-relaxed text-slate-700">{report.insights.summary}</p>
        {insights.length ? (
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
            {insights.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        ) : null}
        <p className="mt-4 text-[11px] text-slate-400">
          Insights are generated from recorded exam results using fixed rules. Class rank is based on average score
          within the student&apos;s class.
        </p>
      </ReportSection>
    </article>
  );
}
