import { percentOrDash, statusClass } from "@/components/reports/format";
import { ReportSection } from "@/components/reports/report-section";
import { ScoreTrend } from "@/components/reports/score-trend";
import { cn, formatDate } from "@/lib/utils";
import type { ClassReport as ClassReportData } from "@/services/report.service";

const EXAM_STATUS: Record<string, string> = { SCHEDULED: "Scheduled", LIVE: "Live", CLOSED: "Closed" };

function StatusPill({ status }: { status: string | null }) {
  if (!status) return <span className="text-slate-400">—</span>;
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusClass(status))}>{status}</span>;
}

export function ClassReport({ report }: { report: ClassReportData }) {
  const { overview } = report;
  const cls = report.class;
  const classLabel = cls.section ? `${cls.name} · ${cls.section}` : cls.name;

  const kpis: Array<[string, string, string?]> = [
    ["Total students", String(overview.totalStudents)],
    ["Active students", String(overview.activeStudents)],
    [
      "Exams conducted",
      String(overview.examsOpened),
      overview.examsScheduled ? `${overview.examsScheduled} scheduled` : undefined,
    ],
    ["Submissions", String(overview.submissions)],
    ["Average score", percentOrDash(overview.averageScore)],
    ["Completion rate", percentOrDash(overview.completionRate)],
    ["Highest score", percentOrDash(overview.highestScore)],
    ["Lowest score", percentOrDash(overview.lowestScore)],
  ];

  const details: Array<[string, string | null]> = [
    ["Academic year", cls.academicYear],
    ["Group", cls.groupName],
    ["Program", cls.program],
    ["Subjects", cls.subjects.length ? cls.subjects.join(", ") : null],
  ];

  return (
    <article className="mx-auto max-w-5xl space-y-8 rounded-2xl bg-white p-6 text-slate-900 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-10 print:max-w-none print:space-y-6 print:rounded-none print:p-0 print:shadow-none">
      <header className="border-b-2 border-violet-700 pb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-700">{report.institution}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Class Academic Report</h1>
        <p className="mt-3 text-xl font-semibold">{classLabel}</p>
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {details
            .filter((entry): entry is [string, string] => Boolean(entry[1]))
            .map(([label, value]) => (
              <div key={label} className="flex gap-1.5">
                <dt className="text-slate-500">{label}:</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
        </dl>
        <p className="mt-2 text-xs text-slate-500">Generated on {formatDate(report.generatedAt)}</p>
      </header>

      <ReportSection title="Class overview">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 print:grid-cols-4">
          {kpis.map(([label, value, hint]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-1 text-xl font-bold">{value}</p>
              {hint ? <p className="text-[11px] text-slate-500">{hint}</p> : null}
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          Scores are percentages from submitted exams. Completion rate is submitted papers divided by assigned papers for
          exams that have opened.
        </p>
      </ReportSection>

      <ReportSection title="Performance trend">
        {report.trend.length < 2 ? (
          <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">
            Not enough data for a trend yet. At least 2 exams with submitted results are needed
            {report.trend.length === 1 ? " (1 so far)" : ""}.
          </p>
        ) : (
          <ScoreTrend series={report.trend} caption="Class average per exam, by exam date" />
        )}
      </ReportSection>

      <ReportSection title="Student performance" allowBreak>
        {report.students.length === 0 ? (
          <p className="text-sm text-slate-500">No students are enrolled in this class.</p>
        ) : (
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full min-w-[720px] text-left text-xs print:min-w-0 print:text-[10px]">
              <thead className="uppercase text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="py-2 pr-3 font-medium">#</th>
                  <th className="py-2 pr-3 font-medium">Student</th>
                  <th className="py-2 pr-3 font-medium">Student ID</th>
                  <th className="py-2 pr-3 font-medium">Roll no.</th>
                  <th className="py-2 pr-3 text-right font-medium">Exams</th>
                  <th className="py-2 pr-3 text-right font-medium">Average</th>
                  <th className="py-2 pr-3 text-right font-medium">Highest</th>
                  <th className="py-2 pr-3 text-right font-medium">Latest</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {report.students.map((student, index) => (
                  <tr key={student.id} className="break-inside-avoid border-b border-slate-100">
                    <td className="py-2 pr-3 text-slate-400">{index + 1}</td>
                    <td className="py-2 pr-3 font-medium">
                      {student.name}
                      {student.status === "INACTIVE" ? (
                        <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-normal text-slate-500">
                          Inactive
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2 pr-3">{student.studentIdentifier}</td>
                    <td className="py-2 pr-3">{student.rollNumber ?? "—"}</td>
                    <td className="py-2 pr-3 text-right">{student.attempted}</td>
                    <td className="py-2 pr-3 text-right font-semibold">{percentOrDash(student.average)}</td>
                    <td className="py-2 pr-3 text-right">{percentOrDash(student.highest)}</td>
                    <td className="py-2 pr-3 text-right">{percentOrDash(student.latest)}</td>
                    <td className="py-2">
                      {student.performance ? (
                        <StatusPill status={student.performance} />
                      ) : (
                        <span className="text-slate-400">No submissions</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ReportSection>

      <ReportSection title="Subject performance">
        {report.subjects.length === 0 ? (
          <p className="text-sm text-slate-500">No published exams for this class yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="py-2 pr-4 font-medium">Subject</th>
                <th className="py-2 pr-4 text-right font-medium">Exams</th>
                <th className="py-2 pr-4 text-right font-medium">Submissions</th>
                <th className="py-2 pr-4 text-right font-medium">Average</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {report.subjects.map((subject) => (
                <tr key={subject.name} className="break-inside-avoid border-b border-slate-100">
                  <td className={cn("py-2 pr-4 font-medium", subject.name === "Not specified" && "italic text-slate-500")}>
                    {subject.name}
                  </td>
                  <td className="py-2 pr-4 text-right">{subject.exams}</td>
                  <td className="py-2 pr-4 text-right">{subject.submissions}</td>
                  <td className="py-2 pr-4 text-right">{percentOrDash(subject.average)}</td>
                  <td className="py-2">
                    <StatusPill status={subject.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ReportSection>

      <ReportSection title="Exam performance" allowBreak>
        {report.exams.length === 0 ? (
          <p className="text-sm text-slate-500">No published exams for this class yet.</p>
        ) : (
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full min-w-[820px] text-left text-xs print:min-w-0 print:text-[10px]">
              <thead className="uppercase text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="py-2 pr-3 font-medium">Exam</th>
                  <th className="py-2 pr-3 font-medium">Subject</th>
                  <th className="py-2 pr-3 font-medium">Date</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 text-right font-medium">Submitted</th>
                  <th className="py-2 pr-3 text-right font-medium">Average</th>
                  <th className="py-2 pr-3 text-right font-medium">Highest</th>
                  <th className="py-2 pr-3 text-right font-medium">Lowest</th>
                  <th className="py-2 text-right font-medium">Completion</th>
                </tr>
              </thead>
              <tbody>
                {report.exams.map((exam) => (
                  <tr key={exam.id} className="break-inside-avoid border-b border-slate-100">
                    <td className="py-2 pr-3 font-medium">{exam.name}</td>
                    <td className={cn("py-2 pr-3", exam.subject === "Not specified" && "italic text-slate-500")}>
                      {exam.subject}
                    </td>
                    <td className="whitespace-nowrap py-2 pr-3">{exam.date ? formatDate(exam.date) : "—"}</td>
                    <td className="py-2 pr-3">{EXAM_STATUS[exam.examStatus] ?? exam.examStatus}</td>
                    <td className="whitespace-nowrap py-2 pr-3 text-right">
                      {exam.submitted}
                      {exam.assigned ? ` / ${exam.assigned}` : ""}
                    </td>
                    <td className="py-2 pr-3 text-right font-semibold">{percentOrDash(exam.average)}</td>
                    <td className="py-2 pr-3 text-right">{percentOrDash(exam.highest)}</td>
                    <td className="py-2 pr-3 text-right">{percentOrDash(exam.lowest)}</td>
                    <td className="py-2 text-right">
                      {exam.opened ? percentOrDash(exam.completionRate) : "Not started"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ReportSection>

      <ReportSection title="Performance insights">
        {report.insights.length === 0 ? (
          <p className="text-sm text-slate-500">
            No submitted results yet, so there are no insights for this class.
          </p>
        ) : (
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">
            {report.insights.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-[11px] text-slate-400">
          Insights are generated from recorded exam results using fixed rules. Status bands: Excellent 85%+, Good 75%+,
          Average 60%+, otherwise Needs Improvement. Trend comparisons appear only after 10 exams with results.
        </p>
      </ReportSection>
    </article>
  );
}
