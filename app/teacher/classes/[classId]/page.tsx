import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { requireClassAccess } from "@/lib/resource-access";
import { classService } from "@/services/class.service";
import { Card } from "@/components/ui/card";

export default async function TeacherClassPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  try {
    await requireClassAccess(await requireSession(["TEACHER"]), classId);
  } catch {
    notFound();
  }
  const cls = await classService.get(classId);
  if (!cls) notFound();
  const subjects = cls.subjects.map((item) => item.subject.name);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Classroom</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">{cls.name}</h1>
          <p className="mt-2 text-sm text-slate-400">
            {cls.academicYear} · {cls.groupName}
            {cls.section ? ` · ${cls.section}` : ""} · {cls._count.enrollments} students
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {subjects.length ? (
              subjects.map((name) => (
                <span key={name} className="rounded-full border border-violet-400/25 bg-violet-500/10 px-2.5 py-0.5 text-xs text-violet-200">
                  {name}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-500">No subjects assigned yet.</span>
            )}
          </div>
        </div>
        <Link
          href={`/teacher/exams/new?classId=${classId}`}
          className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F6BFF] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(124,58,237,0.28)]"
        >
          Create Exam
        </Link>
      </div>
      <Card className="mt-6">
        <h2 className="text-lg font-semibold text-white">Students</h2>
        {cls.enrollments.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No students enrolled in this classroom yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/8">
            {cls.enrollments.map((row) => (
              <li key={row.studentId} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-white">
                    {row.student.firstName} {row.student.lastName}
                  </p>
                  <p className="text-xs text-slate-500">{row.student.studentIdentifier}</p>
                </div>
                <Link href={`/teacher/students/${row.studentId}`} className="text-sm font-medium text-violet-300 hover:text-white">
                  Open report
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
