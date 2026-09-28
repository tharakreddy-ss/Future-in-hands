import { requireSession } from "@/lib/auth";
import { studentService } from "@/services/student.service";
import { testService } from "@/services/test.service";
import { examWindow } from "@/lib/exam-window";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/skeleton";
import { EmptyState } from "@/components/layout/empty-state";
import { ExamCountdown } from "@/components/exams/exam-countdown";
import { notFound } from "next/navigation";
import Link from "next/link";

function windowLabel(test: { status: string; startAt: Date | null; endAt: Date | null }) {
  const window = examWindow(test);
  if (window === "LOCKED" && test.startAt) {
    return (
      <>
        Upcoming · starts in <ExamCountdown startAt={test.startAt.toISOString()} />
      </>
    );
  }
  if (window === "LIVE") return "Exam live";
  if (window === "CLOSED") return "Exam closed";
  return "Scheduled";
}

export default async function StudentClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const user = await requireSession(["STUDENT"]);
  if (!user.studentId) notFound();

  const enrollment = await studentService.classForEnrolledStudent(user.studentId, classId);
  if (!enrollment) notFound();

  const cls = enrollment.class;
  const assignments = (await testService.forStudent(user.studentId)).filter(
    (row) => row.test.classId === classId,
  );

  const ordered = assignments.slice().sort((a, b) => {
    const rank = (row: (typeof assignments)[number]) => {
      const window = examWindow(row.test);
      if (window === "LIVE") return 0;
      if (window === "LOCKED") return 1;
      return 2;
    };
    const diff = rank(a) - rank(b);
    if (diff !== 0) return diff;
    const aStart = a.test.startAt?.getTime() ?? 0;
    const bStart = b.test.startAt?.getTime() ?? 0;
    return aStart - bStart;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={cls.subject}
        title={cls.name}
        subtitle={cls.description ?? undefined}
      />

      <Card>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">Subject</dt>
            <dd className="mt-1 text-white">{cls.subject}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Academic year</dt>
            <dd className="mt-1 text-white">{cls.academicYear}</dd>
          </div>
          {cls.section ? (
            <div>
              <dt className="text-sm text-slate-500">Section</dt>
              <dd className="mt-1 text-white">{cls.section}</dd>
            </div>
          ) : null}
          {cls.createdBy?.name ? (
            <div>
              <dt className="text-sm text-slate-500">Created by</dt>
              <dd className="mt-1 text-white">{cls.createdBy.name}</dd>
            </div>
          ) : null}
        </dl>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-white">Assigned exams</h2>
        <p className="mt-1 text-sm text-slate-500">Exams assigned to you in this class.</p>
        <div className="mt-4 space-y-3">
          {ordered.length === 0 ? (
            <EmptyState
              title="No exams yet"
              description="Assigned and upcoming exams for this class will appear here."
              actionHref="/student/tests"
              actionLabel="View all exams"
            />
          ) : (
            ordered.map((row) => (
              <Link key={row.id} href={`/student/tests/${row.testId}`} className="block">
                <Card className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-white">{row.test.title}</p>
                    <p className="text-sm text-slate-500">
                      {row.test._count.questions} questions · {row.test.durationMinutes} min
                      {row.test.startAt ? ` · ${formatDate(row.test.startAt)}` : ""}
                    </p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-violet-300">
                      {windowLabel(row.test)}
                    </p>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/student/classes" className="text-violet-300 hover:text-white">
          Back to Classes
        </Link>
        <Link href="/student/dashboard" className="text-violet-300 hover:text-white">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
