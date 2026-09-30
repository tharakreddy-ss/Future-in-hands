import { requireSession } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { examService } from "@/services/exam.service";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { ExamMonitorRefresh } from "@/components/exams/exam-monitor-refresh";

export default async function ExamMonitorPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const user = await requireSession(["INSTITUTION_ADMIN"]);
  const { examId } = await params;
  const data = await examService.monitor(examId, requireTenant(user));
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <ExamMonitorRefresh />
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Live monitor</p>
        <h1 className="mt-2 text-3xl font-semibold">{data.test.title}</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Students" value={data.total} />
        <StatCard label="Not Started" value={data.notStarted} />
        <StatCard label="In Progress" value={data.inProgress} />
        <StatCard label="Completed" value={data.completed} />
      </div>
      <Card>
        <ul className="divide-y text-sm">
          {data.test.assignments.map((row) => {
            const attempt = data.test.attempts.find((item) => item.studentId === row.studentId);
            return (
              <li key={row.id} className="flex justify-between py-2">
                <span>
                  {row.student.firstName} {row.student.lastName}
                </span>
                <span>{attempt?.status ?? "NOT_STARTED"}</span>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
