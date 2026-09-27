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
      <div className="relative overflow-hidden rounded-[1.5rem] border border-white/[0.08] bg-[linear-gradient(115deg,rgba(41,29,98,0.7),rgba(13,19,37,0.42))] px-5 py-6 sm:px-7"><div className="pointer-events-none absolute -right-8 -top-16 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl" /><p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">Student portal</p><h1 className="relative mt-2 text-3xl font-semibold tracking-tight text-white">Welcome back, {user.name}</h1><p className="relative mt-2 max-w-xl text-sm text-slate-400">Your next mock test, performance and learning progress are all ready here.</p></div>
      <Stagger className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StaggerItem><StatCard label="My Classes" value={classes.length} /></StaggerItem>
        <StaggerItem><StatCard label="Available Tests" value={assignments.length} /></StaggerItem>
        <StaggerItem><StatCard label="Tests Attempted" value={stats.attempted} /></StaggerItem>
        <StaggerItem><StatCard label="Average Score" value={`${Math.round(stats.averageScore)}%`} /></StaggerItem>
        <StaggerItem><StatCard label="Highest Score" value={`${Math.round(stats.highestScore)}%`} /></StaggerItem>
      </Stagger>
      <div className="mt-10 flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Assessment queue</p><h2 className="mt-1 text-xl font-semibold text-white">Available tests</h2></div><Link href="/student/tests" className="text-sm font-medium text-violet-300 hover:text-white">View all tests</Link></div>
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
