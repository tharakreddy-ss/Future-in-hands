import { requireSession } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { analyticsService } from "@/services/analytics.service";
import { classService } from "@/services/class.service";
import { StatCard } from "@/components/dashboard/stat-card";
import { ClassCard } from "@/components/classes/class-card";
import { EmptyState } from "@/components/layout/empty-state";
import { PageFade, Stagger, StaggerItem } from "@/components/motion/page-fade";
import { PageHeader } from "@/components/layout/skeleton";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const user = await requireSession(["INSTITUTION_ADMIN"]);
  const institutionId = requireTenant(user)!;
  const [stats, classes] = await Promise.all([
    analyticsService.institution(institutionId),
    classService.list(institutionId),
  ]);

  return (
    <PageFade>
      <PageHeader
        eyebrow="Institution"
        title={`Welcome, ${user.name}`}
        subtitle="Classes, exams, and AI generation in one workspace."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/generate"
              className="inline-flex rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F6BFF] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Create Exam
            </Link>
            <Link
              href="/admin/students"
              className="inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100"
            >
              Add Student
            </Link>
          </div>
        }
      />
      <Stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StaggerItem>
          <StatCard label="Total Classes" value={stats.classes} />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Total Students" value={stats.students} />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Total Teachers" value={stats.teachers} />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Active Exams" value={stats.liveExams} />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Average Score" value={`${Math.round(stats.averageScore)}%`} />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Completion Rate" value={`${stats.completionRate}%`} />
        </StaggerItem>
      </Stagger>
      <h2 className="mt-10 text-lg font-semibold text-white">My Classes</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {classes.length === 0 ? (
          <div className="md:col-span-2">
            <EmptyState
              title="No classes yet"
              description="Create your first classroom and start generating AI-powered tests."
              actionHref="/admin/classes/new"
              actionLabel="Create Class"
            />
          </div>
        ) : (
          classes.map((cls) => (
            <ClassCard
              key={cls.id}
              id={cls.id}
              name={cls.name}
              subject={cls.subject}
              students={cls._count.enrollments}
              tests={cls._count.tests}
              createdAt={cls.createdAt}
            />
          ))
        )}
      </div>
    </PageFade>
  );
}
