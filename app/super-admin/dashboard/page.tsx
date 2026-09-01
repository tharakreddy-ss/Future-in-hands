import { StatCard } from "@/components/dashboard/stat-card";
import { analyticsService } from "@/services/analytics.service";
import { institutionService } from "@/services/institution.service";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function SuperAdminDashboard() {
  const [stats, institutions] = await Promise.all([
    analyticsService.platform(),
    institutionService.list(),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Platform"
        title="Super Admin dashboard"
        subtitle="Institutions, users, exams, and system health across MockTest AI."
        actions={
          <Link href="/super-admin/institutions">
            <Button>Add Institution</Button>
          </Link>
        }
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Institutions" value={stats.institutions} />
        <StatCard label="Total Admins" value={stats.admins} />
        <StatCard label="Total Teachers" value={stats.teachers} />
        <StatCard label="Total Students" value={stats.students} />
        <StatCard label="Total Exams" value={stats.tests} />
        <StatCard label="Active Exams" value={stats.liveExams} />
        <StatCard label="Tests Attempted" value={stats.attempts} />
        <StatCard label="AI Questions" value={stats.aiQuestionsGenerated} />
      </div>
      <h2 className="mt-10 text-lg font-semibold text-white">Institutions</h2>
      <ul className="mt-4 divide-y divide-white/8 rounded-2xl border border-white/8 bg-[#11182A]">
        {institutions.map((item) => (
          <li key={item.id} className="flex items-center justify-between px-4 py-3">
            <span className="text-white">{item.name}</span>
            <span className="flex items-center gap-2 text-sm text-slate-400">
              {item.subscriptionPlan}
              <Badge tone={item.status === "ACTIVE" ? "green" : "amber"}>{item.status}</Badge>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
