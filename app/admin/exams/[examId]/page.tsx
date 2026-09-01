import { requireSession } from "@/lib/auth";
import { examService } from "@/services/exam.service";
import { examWindow } from "@/lib/exam-window";
import { Card } from "@/components/ui/card";
import { ExamReschedule } from "@/components/exams/exam-reschedule";
import { PageFade } from "@/components/motion/page-fade";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatPercent } from "@/lib/utils";

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const user = await requireSession(["INSTITUTION_ADMIN"]);
  const { examId } = await params;
  const exam = await examService.get(examId);
  if (!exam || exam.institutionId !== user.institutionId) notFound();
  const window = examWindow(exam);

  return (
    <PageFade>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-violet-300">{window}</p>
            <h1 className="mt-2 text-3xl font-semibold">{exam.title}</h1>
            <p className="text-slate-500">
              {exam.class.name} · {exam.papers.length} paper variations
            </p>
          </div>
          <Link href={`/admin/exams/${exam.id}/monitor`} className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F6BFF] px-4 py-2 text-sm font-semibold text-white">
            Monitor
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {exam.papers.map((paper) => (
            <Card key={paper.id}>
              <p className="font-semibold">{paper.label}</p>
              <p className="mt-1 text-sm text-slate-500">
                {(paper.questionIdsJson as string[]).length} questions
              </p>
            </Card>
          ))}
        </div>
        <ExamReschedule
          examId={exam.id}
          startAt={exam.startAt}
          endAt={exam.endAt}
          durationMinutes={exam.durationMinutes}
        />
        <Card>
          <h2 className="mb-3 font-semibold">Student assignments</h2>
          <ul className="divide-y text-sm">
            {exam.assignments.map((row) => (
              <li key={row.id} className="flex justify-between py-2">
                <span>
                  {row.student.firstName} {row.student.lastName} → {row.paper?.label ?? "Paper"}
                </span>
                <span className="text-slate-500">{row.status}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Results</h2>
          <ul className="divide-y text-sm">
            {exam.attempts
              .filter((row) => row.status === "SUBMITTED")
              .map((row) => {
                const student = exam.assignments.find((item) => item.studentId === row.studentId)?.student;
                return (
                  <li key={row.id} className="flex justify-between py-2">
                    <span>
                      {student ? `${student.firstName} ${student.lastName}` : row.studentId}
                    </span>
                    <span>
                      {row.score}/{row.totalQuestions} ({formatPercent(row.percentage)})
                    </span>
                  </li>
                );
              })}
          </ul>
        </Card>
      </div>
    </PageFade>
  );
}
