import { requireSession } from "@/lib/auth";
import { studentService } from "@/services/student.service";
import { testService } from "@/services/test.service";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/skeleton";
import { EmptyState } from "@/components/layout/empty-state";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function StudentClassesPage() {
  const user = await requireSession(["STUDENT"]);
  if (!user.studentId) notFound();
  const [enrollments, assignments] = await Promise.all([
    studentService.classesForStudent(user.studentId),
    testService.forStudent(user.studentId),
  ]);
  const assignedByClass = new Map<string, number>();
  for (const row of assignments) {
    assignedByClass.set(row.test.classId, (assignedByClass.get(row.test.classId) ?? 0) + 1);
  }

  return (
    <div>
      <PageHeader title="My classes" subtitle="Only classrooms you are enrolled in." />
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
          enrollments.map((row) => {
            const assigned = assignedByClass.get(row.class.id) ?? 0;
            const resources = row.class._count.syllabuses + row.class._count.subjects;
            const meta = [
              row.class.academicYear,
              row.class.section,
              row.class.groupName && row.class.groupName !== "General" ? row.class.groupName : null,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <Link key={row.id} href={`/student/classes/${row.class.id}`} className="block">
                <Card>
                  <p className="text-sm text-violet-300">{row.class.subject}</p>
                  <h2 className="mt-1 text-lg font-semibold text-white">{row.class.name}</h2>
                  {row.class.description ? (
                    <p className="mt-2 text-sm text-slate-500">{row.class.description}</p>
                  ) : (
                    <p className="mt-2 text-sm text-slate-600">No description provided.</p>
                  )}
                  {meta ? <p className="mt-3 text-xs text-slate-500">{meta}</p> : null}
                  {row.class.createdBy?.name ? (
                    <p className="mt-1 text-xs text-slate-500">Created by {row.class.createdBy.name}</p>
                  ) : null}
                  <p className="mt-3 text-sm text-slate-400">
                    {assigned} assigned {assigned === 1 ? "exam" : "exams"}
                    {" · "}
                    {resources} {resources === 1 ? "resource" : "resources"}
                  </p>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
