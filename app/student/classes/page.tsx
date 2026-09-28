import { requireSession } from "@/lib/auth";
import { studentService } from "@/services/student.service";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/skeleton";
import { EmptyState } from "@/components/layout/empty-state";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function StudentClassesPage() {
  const user = await requireSession(["STUDENT"]);
  if (!user.studentId) notFound();
  const enrollments = await studentService.classesForStudent(user.studentId);

  return (
    <div>
      <PageHeader title="My classes" subtitle="Classes you are enrolled in." />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {enrollments.length === 0 ? (
          <div className="md:col-span-2">
            <EmptyState
              title="No classes yet"
              description="When your institution enrolls you in a class, it will appear here."
              actionHref="/student/dashboard"
              actionLabel="Back to Dashboard"
            />
          </div>
        ) : (
          enrollments.map((row) => (
            <Link key={row.id} href={`/student/classes/${row.class.id}`} className="block">
              <Card>
                <p className="text-sm text-violet-300">{row.class.subject}</p>
                <h2 className="mt-1 text-lg font-semibold text-white">{row.class.name}</h2>
                {row.class.description ? (
                  <p className="mt-2 text-sm text-slate-500">{row.class.description}</p>
                ) : null}
                <p className="mt-3 text-sm text-slate-500">{row.class.tests.length} tests</p>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
