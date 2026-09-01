import { requireSession } from "@/lib/auth";
import { testService } from "@/services/test.service";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { StartTestButton } from "@/components/tests/start-test-button";
import { ExamCountdown } from "@/components/exams/exam-countdown";
import { examWindow } from "@/lib/exam-window";
import { db } from "@/lib/db";

export default async function StudentTestDetailPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;
  const user = await requireSession(["STUDENT"]);
  if (!user.studentId) notFound();
  const assignments = await testService.forStudent(user.studentId);
  const assignment = assignments.find((row) => row.testId === testId);
  if (!assignment) notFound();
  const attempt = await db.studentTestAttempt.findUnique({
    where: { studentId_testId: { studentId: user.studentId, testId } },
  });
  const window = examWindow(assignment.test);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="text-sm text-violet-300">{assignment.test.class.name}</p>
        <h1 className="text-2xl font-semibold">{assignment.test.title}</h1>
      </div>
      <Card>
        <p className="text-sm text-slate-500">Duration</p>
        <p className="mt-1 text-lg">{assignment.test.durationMinutes} minutes</p>
        <p className="mt-4 text-sm text-slate-500">{assignment.test._count.questions} questions</p>
        {window === "LOCKED" && assignment.test.startAt ? (
          <p className="mt-4 text-sm font-medium text-violet-200">
            Exam locked · starts in <ExamCountdown startAt={assignment.test.startAt.toISOString()} />
          </p>
        ) : null}
        {window === "LIVE" ? <p className="mt-4 text-sm font-medium text-cyan-300">Exam live</p> : null}
        {window === "CLOSED" ? <p className="mt-4 text-sm font-medium text-slate-500">Exam closed</p> : null}
      </Card>
      <StartTestButton assignmentId={assignment.id} attemptId={attempt?.id} status={attempt?.status} window={window} />
    </div>
  );
}
