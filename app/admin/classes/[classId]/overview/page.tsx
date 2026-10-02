import { requireSession } from "@/lib/auth";
import { requireClassAccess } from "@/lib/resource-access";
import { classService } from "@/services/class.service";
import { analyticsService } from "@/services/analytics.service";
import { Card } from "@/components/ui/card";
import { notFound } from "next/navigation";

export default async function ClassOverviewPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  await requireClassAccess(await requireSession(["INSTITUTION_ADMIN", "TEACHER"]), classId);
  const cls = await classService.get(classId);
  if (!cls) notFound();
  const performance = await analyticsService.classPerformance(classId);
  const completed = performance.results.length;
  const avg =
    performance.results.length === 0
      ? 0
      : performance.results.reduce((sum, row) => sum + row.percentage, 0) / performance.results.length;

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <p className="text-sm text-slate-500">Total Students</p>
          <p className="mt-2 text-3xl font-semibold">{cls._count.enrollments}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Total Tests</p>
          <p className="mt-2 text-3xl font-semibold">{cls._count.tests}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Tests Completed</p>
          <p className="mt-2 text-3xl font-semibold">{completed}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Average Class Score</p>
          <p className="mt-2 text-3xl font-semibold">{Math.round(avg)}%</p>
        </Card>
      </div>
    </div>
  );
}
