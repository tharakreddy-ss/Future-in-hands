import { requireSession } from "@/lib/auth";
import { examService } from "@/services/exam.service";
import { examWindow } from "@/lib/exam-window";
import { Card } from "@/components/ui/card";
import { ExamReschedule } from "@/components/exams/exam-reschedule";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function TeacherExamDetailPage({ params }: { params: Promise<{ examId: string }> }) {
  const user = await requireSession(["TEACHER"]);
  const { examId } = await params;
  const exam = await examService.get(examId);
  if (!exam || exam.institutionId !== user.institutionId) notFound();
  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-violet-300">{examWindow(exam)}</p>
          <h1 className="mt-2 text-3xl font-semibold">{exam.title}</h1>
        </div>
        <Link href={`/teacher/exams/${exam.id}/monitor`} className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F6BFF] px-4 py-2 text-sm font-semibold">
          Monitor
        </Link>
      </div>
      <ExamReschedule examId={exam.id} startAt={exam.startAt} endAt={exam.endAt} durationMinutes={exam.durationMinutes} />
      <Card>
        <h2 className="mb-3 font-semibold">Assignments</h2>
        <ul className="divide-y divide-white/8 text-sm">
          {exam.assignments.map((row) => (
            <li key={row.id} className="flex justify-between py-2">
              <span>
                {row.student.firstName} {row.student.lastName} → {row.paper?.label}
              </span>
              <span className="text-slate-500">{row.status}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
