import { requireSession } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { analyticsService } from "@/services/analytics.service";
import { PageHeader } from "@/components/layout/skeleton";
import { StatCard } from "@/components/dashboard/stat-card";

export default async function TeacherAnalyticsPage() {
  const user = await requireSession(["TEACHER"]);
  const stats = await analyticsService.institution(requireTenant(user)!);
  return (
    <div>
      <PageHeader title="Analytics" />
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <StatCard label="Students" value={stats.students} />
        <StatCard label="Average Score" value={`${Math.round(stats.averageScore)}%`} />
        <StatCard label="Tests" value={stats.tests} />
        <StatCard label="Attempts" value={stats.attempts} />
      </div>
    </div>
  );
}
