import { classService } from "@/services/class.service";
import { analyticsService } from "@/services/analytics.service";
import { Card } from "@/components/ui/card";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function ClassOverviewPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
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
      <div className="flex justify-end">
        <Link
          href={`/admin/exams/new?classId=${classId}&source=syllabus`}
          className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F6BFF] px-5 py-3 text-sm font-semibold text-white"
        >
          Generate Test
        </Link>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
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
