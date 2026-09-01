import { analyticsService } from "@/services/analytics.service";
import { ScoreBars } from "@/components/analytics/score-bars";
import { StatCard } from "@/components/dashboard/stat-card";

export default async function SuperAdminAnalyticsPage() {
  const stats = await analyticsService.platform();
  return (
    <div>
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Attempts" value={stats.attempts} />
        <StatCard label="Average score" value={`${Math.round(stats.averageScore)}%`} />
        <StatCard label="Tests" value={stats.tests} />
      </div>
      <div className="mt-8 rounded-2xl border border-white/8 bg-[#11182A] p-5">
        <ScoreBars
          items={[
            { label: "Platform average", value: stats.averageScore },
            { label: "Adoption (tests / institutions)", value: stats.institutions ? (stats.tests / stats.institutions) * 20 : 0 },
          ]}
        />
      </div>
    </div>
  );
}
