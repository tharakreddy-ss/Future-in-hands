import { requireSession } from "@/lib/auth";
import { examService } from "@/services/exam.service";
import { StatCard } from "@/components/dashboard/stat-card";
import { notFound } from "next/navigation";
import { ExamMonitorRefresh } from "@/components/exams/exam-monitor-refresh";

export default async function SuperAdminExamMonitorPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  await requireSession(["SUPER_ADMIN"]);
  const { examId } = await params;
  const data = await examService.monitor(examId);
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <ExamMonitorRefresh />
      <h1 className="text-3xl font-semibold">{data.test.title}</h1>
      <p className="text-slate-500">{data.test.institution.name}</p>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Students" value={data.total} />
        <StatCard label="Not Started" value={data.notStarted} />
        <StatCard label="In Progress" value={data.inProgress} />
        <StatCard label="Completed" value={data.completed} />
      </div>
    </div>
  );
}
