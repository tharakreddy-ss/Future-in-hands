import { requireSession } from "@/lib/auth";
import { testService } from "@/services/test.service";
import { studentService } from "@/services/student.service";
import { analyticsService } from "@/services/analytics.service";
import { notificationService } from "@/services/notification.service";
import { db } from "@/lib/db";
import { StatCard } from "@/components/dashboard/stat-card";
import { StartTestButton } from "@/components/tests/start-test-button";
import { examWindow } from "@/lib/exam-window";
import { ExamCountdown } from "@/components/exams/exam-countdown";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/skeleton";
import { PageFade, Stagger, StaggerItem } from "@/components/motion/page-fade";
import { EmptyState } from "@/components/layout/empty-state";
import { formatDate, formatPercent } from "@/lib/utils";
import { formatNoticeTime, notificationTypeLabel } from "@/components/notifications/notice-helpers";

function formatDateTime(value: Date | string) {
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function classMeta(cls: {
  academicYear: string | null;
  section: string | null;
  groupName: string | null;
}) {
  return [
    cls.academicYear,
    cls.section,
    cls.groupName && cls.groupName !== "General" ? cls.groupName : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

const QUICK_LINKS = [
  { href: "/student/classes", label: "Classes", hint: "Enrolled classrooms" },
  { href: "/student/results", label: "Results", hint: "Submitted exam reviews" },
  { href: "/student/analytics", label: "Analytics", hint: "Scores over time" },
  { href: "/student/notifications", label: "Notifications", hint: "Reminders and results" },
] as const;

export default async function StudentDashboardPage() {
  const user = await requireSession(["STUDENT"]);
  if (!user.studentId) notFound();
  const studentId = user.studentId;

  const [assignments, classCount, classSummaries, stats, attempts, unread, notices] = await Promise.all([
    testService.forStudent(studentId),
    studentService.enrollmentCount(studentId),
    studentService.classSummariesForStudent(studentId, 4),
    analyticsService.student(studentId),
    db.studentTestAttempt.findMany({
      where: { studentId },
      select: { id: true, testId: true, status: true },
    }),
    notificationService.unreadCount(studentId),
    notificationService.recentUnread(studentId, 3),
  ]);

  const attemptByTest = new Map(attempts.map((row) => [row.testId, row]));
  const upcoming = assignments
    .map((row) => ({ row, window: examWindow(row.test) }))
    .filter((item) => item.window === "LIVE" || item.window === "LOCKED")
    .sort((a, b) => {
      if (a.window !== b.window) return a.window === "LIVE" ? -1 : 1;
      const aStart = a.row.test.startAt ? new Date(a.row.test.startAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bStart = b.row.test.startAt ? new Date(b.row.test.startAt).getTime() : Number.MAX_SAFE_INTEGER;
      return aStart - bStart;
    });

  const hasSubmitted = stats.attempted > 0;
  const recentResults = stats.history.slice(0, 3);

  return (
    <PageFade>
      <PageHeader
        eyebrow="Student portal"
        title={`Welcome back, ${user.name}`}
        subtitle="Upcoming exams, recent scores, classes, and notifications for your account."
      />

      <Stagger className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StaggerItem>
          <StatCard label="My Classes" value={classCount} hint="Classes you are enrolled in" />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Upcoming / Live Exams"
            value={upcoming.length}
            hint="Locked or live assignments"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Tests Attempted"
            value={stats.attempted}
            hint={stats.attempted === 1 ? "1 submitted exam" : "Submitted exams"}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Average Score"
            value={hasSubmitted ? formatPercent(stats.averageScore) : "—"}
            hint={hasSubmitted ? "Across submitted exams" : "No submitted exams yet"}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Highest Score"
            value={hasSubmitted ? formatPercent(stats.highestScore) : "—"}
            hint={hasSubmitted ? "Best submitted exam" : "No submitted exams yet"}
          />
        </StaggerItem>
      </Stagger>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Exams</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Upcoming and live</h2>
          </div>
          <Link href="/student/tests" className="text-sm font-medium text-violet-300 hover:text-white">
            View all exams
          </Link>
        </div>
        <ul className="mt-4 space-y-3">
          {upcoming.length === 0 ? (
            <li>
              <EmptyState
                title="No upcoming exams"
                description="When an exam is scheduled for you, it will appear here while it is locked or live. Closed exams stay on the Exams page."
                actionHref="/student/tests"
                actionLabel="View exams"
              />
            </li>
          ) : (
            upcoming.map(({ row, window }) => {
              const attempt = attemptByTest.get(row.testId);
              const start = row.test.startAt;
              const end = row.test.endAt;
              const statusLabel =
                window === "LOCKED" && start ? (
                  <>
                    Locked · starts in <ExamCountdown startAt={start.toISOString()} />
                  </>
                ) : window === "LIVE" ? (
                  "Live"
                ) : (
                  "Closed"
                );
              return (
                <li key={row.id}>
                  <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/student/tests/${row.testId}`}
                          className="text-lg font-semibold text-white hover:text-violet-300"
                        >
                          {row.test.title}
                        </Link>
                        <Badge tone={window === "LIVE" ? "teal" : "amber"}>{window === "LIVE" ? "Live" : "Locked"}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {row.test.class.name} · {row.test._count.questions} questions · {row.test.durationMinutes} min
                      </p>
                      {start || end ? (
                        <p className="mt-1 text-xs text-slate-500">
                          {start ? `Starts ${formatDateTime(start)}` : "Start time not set"}
                          {end ? ` · Ends ${formatDateTime(end)}` : ""}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-violet-300">{statusLabel}</p>
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
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">Recent results</h2>
            <Link href="/student/results" className="text-sm font-medium text-violet-300 hover:text-white">
              View all results
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {!hasSubmitted ? (
              <EmptyState
                title="No results yet"
                description="Completed exams will appear here after you submit."
                actionHref="/student/tests"
                actionLabel="View exams"
              />
            ) : (
              recentResults.map((row) => {
                const when = row.submittedAt ?? row.startedAt;
                return (
                  <Link key={row.id} href={`/student/results/${row.id}`} className="block">
                    <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-white">{row.test.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{formatDate(when)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge tone="purple">
                          {row.score}/{row.totalQuestions}
                        </Badge>
                        <span className="text-lg font-semibold text-violet-300">{formatPercent(row.percentage)}</span>
                      </div>
                    </Card>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">My classes</h2>
            <Link href="/student/classes" className="text-sm font-medium text-violet-300 hover:text-white">
              View all classes
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {classCount === 0 ? (
              <EmptyState
                title="No classes yet"
                description="When your institution enrolls you in a class, it will appear here."
                actionHref="/student/classes"
                actionLabel="View classes"
              />
            ) : (
              classSummaries.map((row) => {
                const meta = classMeta(row.class);
                return (
                  <Link key={row.id} href={`/student/classes/${row.class.id}`} className="block">
                    <Card>
                      <p className="text-sm text-violet-300">{row.class.subject}</p>
                      <h3 className="mt-1 text-lg font-semibold text-white">{row.class.name}</h3>
                      {meta ? <p className="mt-2 text-xs text-slate-500">{meta}</p> : null}
                    </Card>
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </div>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">Notifications</h2>
          <Link href="/student/notifications" className="text-sm font-medium text-violet-300 hover:text-white">
            View notifications
          </Link>
        </div>
        <Card className="mt-4">
          <p className="text-sm text-slate-400">
            {unread === 0
              ? "No unread notifications."
              : `${unread} unread ${unread === 1 ? "notification" : "notifications"}.`}
          </p>
          {unread === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="You're all caught up"
                description="Exam reminders and result notices will show here when they arrive."
                actionHref="/student/notifications"
                actionLabel="Open notifications"
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {notices.map((item) => (
                <li key={item.id} className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-violet-300">
                    {notificationTypeLabel(item.type)}
                  </p>
                  <p className="mt-1 font-medium text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.body}</p>
                  <p className="mt-2 text-xs text-slate-600">{formatNoticeTime(item.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-white">Quick links</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="block">
              <Card className="h-full">
                <p className="font-semibold text-white">{item.label}</p>
                <p className="mt-1 text-xs text-slate-500">{item.hint}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </PageFade>
  );
}
