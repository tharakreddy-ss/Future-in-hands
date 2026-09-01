import { requireSession } from "@/lib/auth";
import { analyticsService } from "@/services/analytics.service";
import { PageHeader } from "@/components/layout/skeleton";
import { StatCard } from "@/components/dashboard/stat-card";

export default async function StudentAnalyticsPage() {
  const user = await requireSession(["STUDENT"]);
  const stats = await analyticsService.student(user.studentId!);
  return (
    <div>
      <PageHeader title="My analytics" subtitle="Strengths, weak topics, and score trend." />
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <StatCard label="Average Score" value={`${Math.round(stats.averageScore)}%`} />
        <StatCard label="Highest Score" value={`${Math.round(stats.highestScore)}%`} />
        <StatCard label="Tests Attempted" value={stats.attempted} />
        <StatCard label="Improvement" value="—" />
      </div>
    </div>
  );
}
