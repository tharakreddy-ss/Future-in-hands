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

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

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
        subtitle="Run your institute from academic setup to student results in one organized workspace."
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
      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Daily workflow</p><h2 className="mt-1 text-lg font-semibold text-white">Set up the academic year in order</h2></div><Link href="/admin/classes/new" className="text-sm font-medium text-violet-300 hover:text-white">Create a classroom</Link></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[{ n: "01", title: "Create year & group", copy: "Arrange batches under 1st–4th year.", href: "/admin/classes/new" }, { n: "02", title: "Add students", copy: "Create ID, login and academic profile.", href: "/admin/students" }, { n: "03", title: "Add source material", copy: "Use topic, text or reviewed files.", href: "/admin/subjects" }, { n: "04", title: "Schedule an exam", copy: "Generate, assign and monitor tests.", href: "/admin/generate" }].map((step) => <Link key={step.n} href={step.href} className="group rounded-2xl border border-white/[0.08] bg-[#11182A] p-4 hover:border-violet-400/35"><span className="text-xs font-bold text-violet-300">{step.n}</span><h3 className="mt-3 font-semibold text-white">{step.title}</h3><p className="mt-1 text-sm text-slate-500">{step.copy}</p></Link>)}
        </div>
      </section>
      <section className="mt-10"><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Academic years</p><h2 className="mt-1 text-lg font-semibold text-white">Classroom directory</h2></div><Link href="/admin/classes" className="text-sm font-medium text-violet-300 hover:text-white">View all classrooms</Link></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{YEARS.map((year) => { const rows = classes.filter((item) => item.academicYear === year); return <Link key={year} href={`/admin/classes?year=${encodeURIComponent(year)}`} className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#151D31] to-[#0D1324] p-4 hover:border-violet-400/35"><p className="text-sm font-semibold text-white">{year}</p><p className="mt-3 text-2xl font-semibold text-violet-200">{rows.length}</p><p className="text-xs text-slate-500">classrooms · {rows.reduce((sum, row) => sum + row._count.enrollments, 0)} students</p></Link>; })}</div></section>
      <h2 className="mt-10 text-lg font-semibold text-white">Recently added classrooms</h2>
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
          classes.slice(0, 4).map((cls) => (
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
