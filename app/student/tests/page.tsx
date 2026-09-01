import { requireSession } from "@/lib/auth";
import { testService } from "@/services/test.service";
import { db } from "@/lib/db";
import { TestCard } from "@/components/tests/test-card/test-card";
import { StartTestButton } from "@/components/tests/start-test-button";
import { ExamCountdown } from "@/components/exams/exam-countdown";
import { examWindow } from "@/lib/exam-window";
import { examService } from "@/services/exam.service";
import { notificationService } from "@/services/notification.service";
import { EmptyState } from "@/components/layout/empty-state";
import Link from "next/link";

export default async function StudentTestsPage() {
  const user = await requireSession(["STUDENT"]);
  if (!user.studentId) throw new Error("Student profile missing");
  await examService.syncWindows(user.institutionId);
  await notificationService.dispatchDue(user.studentId);
  const assignments = await testService.forStudent(user.studentId);
  const attempts = await db.studentTestAttempt.findMany({ where: { studentId: user.studentId } });
  const attemptByTest = new Map(attempts.map((row) => [row.testId, row]));

  return (
    <div>
      <h1 className="text-2xl font-semibold">Tests</h1>
      <div className="mt-6 space-y-4">
        {assignments.length === 0 ? (
          <EmptyState title="No tests yet" description="When your institution schedules an exam, it will appear here with a live countdown." />
        ) : (
          assignments.map((row) => {
            const attempt = attemptByTest.get(row.testId);
            const window = examWindow(row.test);
            return (
              <div key={row.id} className="flex flex-col gap-4 rounded-2xl border border-white/8 bg-[#11182A] p-4 sm:flex-row sm:items-center sm:justify-between">
                <Link href={`/student/tests/${row.testId}`} className="flex-1">
                  <TestCard
                    title={row.test.title}
                    status={attempt?.status ?? row.status}
                    durationMinutes={row.test.durationMinutes}
                    questionCount={row.test._count.questions}
                  />
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-violet-300">
                    {window === "LOCKED" && row.test.startAt ? (
                      <>
                        Exam locked · starts in <ExamCountdown startAt={row.test.startAt.toISOString()} />
                      </>
                    ) : window === "LIVE" ? (
                      "Exam live"
                    ) : (
                      "Exam closed"
                    )}
                  </p>
                </Link>
                <StartTestButton assignmentId={row.id} attemptId={attempt?.id} status={attempt?.status} window={window} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
