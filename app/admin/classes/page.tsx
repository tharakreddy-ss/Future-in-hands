import { requireSession } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { classService } from "@/services/class.service";
import { ClassCard } from "@/components/classes/class-card";
import { EmptyState } from "@/components/layout/empty-state";
import Link from "next/link";

export default async function ClassesPage() {
  const user = await requireSession(["INSTITUTION_ADMIN"]);
  const classes = await classService.list(requireTenant(user)!);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Classes</h1>
        <Link href="/admin/classes/new" className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F6BFF] px-4 py-2 text-sm font-semibold text-white">
          New class
        </Link>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
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
    </div>
  );
}
