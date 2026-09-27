import { requireSession } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { analyticsService } from "@/services/analytics.service";
import { classService } from "@/services/class.service";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/layout/skeleton";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/layout/empty-state";

export default async function TeacherDashboardPage() {
  const user = await requireSession(["TEACHER"]);
  const institutionId = requireTenant(user)!;
  const [stats, classes] = await Promise.all([
    analyticsService.institution(institutionId),
    classService.list(institutionId),
  ]);
  return (
    <div>
      <PageHeader
        title={`Welcome, ${user.name}`}
        subtitle="Assigned classes, exams, and AI generation in one place."
        actions={
          <Link href="/teacher/generate">
            <Button>Generate Questions</Button>
          </Link>
        }
      />
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <StatCard label="Assigned Classes" value={classes.length} />
        <StatCard label="Institution Students" value={stats.students} />
        <StatCard label="Institution Live Exams" value={stats.liveExams} />
        <StatCard label="Institution Average" value={`${Math.round(stats.averageScore)}%`} />
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {classes.length === 0 ? (
          <div className="md:col-span-2">
            <EmptyState title="No classes are available yet" description="When your institution adds classes, you can prepare question sets and exams from this dashboard." actionHref="/teacher/classes" actionLabel="View Classes" />
          </div>
        ) : classes.map((cls) => (
          <Card key={cls.id}>
            <p className="text-xs text-violet-300">{cls.subject}</p>
            <h3 className="mt-1 text-lg font-semibold">{cls.name}</h3>
            <p className="mt-2 text-sm text-slate-400">{cls._count.enrollments} students · {cls._count.tests} exams</p>
            <Link
              href="/teacher/generate"
              className="mt-4 inline-block text-sm font-medium text-violet-300 hover:text-violet-200"
            >
              Generate questions <span aria-hidden>→</span>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
