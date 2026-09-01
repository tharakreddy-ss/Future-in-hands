import { requireSession } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { analyticsService } from "@/services/analytics.service";
import { classService } from "@/services/class.service";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/layout/skeleton";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
        <StatCard label="Total Students" value={stats.students} />
        <StatCard label="Active Exams" value={stats.liveExams} />
        <StatCard label="Average Score" value={`${Math.round(stats.averageScore)}%`} />
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {classes.map((cls) => (
          <Card key={cls.id}>
            <p className="text-xs text-violet-300">{cls.subject}</p>
            <h3 className="mt-1 text-lg font-semibold">{cls.name}</h3>
            <p className="mt-2 text-sm text-slate-400">{cls._count.enrollments} students</p>
            <Link
              href={`/teacher/exams/new?classId=${cls.id}&source=syllabus`}
              className="mt-4 inline-block text-sm text-violet-300"
            >
              Generate Test
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
