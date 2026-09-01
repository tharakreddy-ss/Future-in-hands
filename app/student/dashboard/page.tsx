import { requireSession } from "@/lib/auth";
import { testService } from "@/services/test.service";
import { studentService } from "@/services/student.service";
import { analyticsService } from "@/services/analytics.service";
import { examService } from "@/services/exam.service";
import { notificationService } from "@/services/notification.service";
import { db } from "@/lib/db";
import { StatCard } from "@/components/dashboard/stat-card";
import { StartTestButton } from "@/components/tests/start-test-button";
import { examWindow } from "@/lib/exam-window";
import { ExamCountdown } from "@/components/exams/exam-countdown";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageFade, Stagger, StaggerItem } from "@/components/motion/page-fade";
import { EmptyState } from "@/components/layout/empty-state";

export default async function StudentDashboardPage() {
  const user = await requireSession(["STUDENT"]);
  if (!user.studentId) throw new Error("Student profile missing");
  await examService.syncWindows(user.institutionId);
  await notificationService.dispatchDue(user.studentId);
  const [assignments, classes, stats, attempts] = await Promise.all([
    testService.forStudent(user.studentId),
    studentService.classesForStudent(user.studentId),
    analyticsService.student(user.studentId),
    db.studentTestAttempt.findMany({ where: { studentId: user.studentId } }),
  ]);
  const attemptByTest = new Map(attempts.map((row) => [row.testId, row]));

  return (
    <PageFade>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Student portal</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Welcome, {user.name}</h1>
      <Stagger className="mt-6 grid gap-4 md:grid-cols-5">
        <StaggerItem><StatCard label="My Classes" value={classes.length} /></StaggerItem>
        <StaggerItem><StatCard label="Available Tests" value={assignments.length} /></StaggerItem>
        <StaggerItem><StatCard label="Tests Attempted" value={stats.attempted} /></StaggerItem>
        <StaggerItem><StatCard label="Average Score" value={`${Math.round(stats.averageScore)}%`} /></StaggerItem>
        <StaggerItem><StatCard label="Highest Score" value={`${Math.round(stats.highestScore)}%`} /></StaggerItem>
      </Stagger>
      <h2 className="mt-10 text-lg font-semibold">Available tests</h2>
      <ul className="mt-4 space-y-3">
        {assignments.length === 0 ? (
          <li>
            <EmptyState title="No exams assigned" description="Your upcoming mock tests will appear here with a live start countdown." />
          </li>
        ) : (
          assignments.map((row) => {
            const attempt = attemptByTest.get(row.testId);
            const window = examWindow(row.test);
            const label =
              window === "LOCKED" && row.test.startAt ? (
                <>
                  Exam locked · starts in <ExamCountdown startAt={row.test.startAt.toISOString()} />
                </>
              ) : window === "LIVE" ? (
                "Exam live"
              ) : (
                "Exam closed"
              );
            return (
              <li key={row.id}>
                <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Link href={`/student/tests/${row.testId}`} className="text-lg font-semibold text-white hover:text-violet-300">
                      {row.test.title}
                    </Link>
                    <p className="text-sm text-slate-500">
                      {row.test.class.name} · {row.test._count.questions} questions · {row.test.durationMinutes} min
                    </p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-violet-300">{label}</p>
                  </div>
                  <StartTestButton
                    assignmentId={row.id}
                    attemptId={attempt?.id}
                    status={attempt?.status}
                    window={window}
                  />
                </Card>
              </li>
            );
          })
        )}
      </ul>
    </PageFade>
  );
}
