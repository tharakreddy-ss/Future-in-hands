import { requireSession } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { analyticsService } from "@/services/analytics.service";
import { PageHeader } from "@/components/layout/skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AdminAnalyticsPage() {
  const user = await requireSession(["INSTITUTION_ADMIN"]);
  const stats = await analyticsService.institution(requireTenant(user)!);
  return (
    <div>
      <PageHeader title="Analytics" subtitle="Track performance and learning gaps." />
      <div className="mt-6 grid gap-4 md:grid-cols-5">
        <StatCard label="Total Students" value={stats.students} />
        <StatCard label="Average Score" value={`${Math.round(stats.averageScore)}%`} />
        <StatCard label="Tests" value={stats.tests} />
        <StatCard label="Attempts" value={stats.attempts} />
        <StatCard label="Completion Rate" value={`${stats.completionRate}%`} />
      </div>
      <Card className="mt-6">
        <h2 className="font-semibold">AI Learning Insights</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-400">
          <li>Class performance is tracking at {Math.round(stats.averageScore)}% average.</li>
          <li>Recommended action: run a revision test on weaker topics from the last paper.</li>
        </ul>
        <Link href="/admin/generate" className="mt-4 inline-block">
          <Button>Generate Practice Test</Button>
        </Link>
      </Card>
    </div>
  );
}
