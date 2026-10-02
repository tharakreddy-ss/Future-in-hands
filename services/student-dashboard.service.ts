import { cache } from "react";
import type { PointActivity } from "@prisma/client";
import { db } from "@/lib/db";
import { examWindow } from "@/lib/exam-window";
import { analyticsService } from "@/services/analytics.service";
import { gamificationService, POINT_RULES, STREAK_MILESTONES, STREAK_TIME_ZONE, streakDayKey } from "@/services/gamification.service";
import { studentService } from "@/services/student.service";
import { testService } from "@/services/test.service";

const DAY_MS = 24 * 60 * 60 * 1000;
const SCHEDULE_PAST_DAYS = 6;
const SCHEDULE_FUTURE_DAYS = 7;
const QUALIFYING: PointActivity[] = ["PRACTICE_COMPLETED", "EXAM_SUBMITTED", "LIVE_EXAM_COMPLETED"];

/** Shared by the student layout and pages within one request. */
export const getStudentPortalContext = cache((studentId: string) => studentService.portalContext(studentId));

/** One ranking computation per request, shared by the header, dashboard and leaderboard. */
export const getStudentGamificationSummary = cache((studentId: string) => gamificationService.summaryForStudent(studentId));

export type DashboardExam = {
  assignmentId: string;
  testId: string;
  title: string;
  className: string;
  subject: string;
  window: "LIVE" | "LOCKED";
  questionCount: number;
  durationMinutes: number;
  startAt: string | null;
  endAt: string | null;
  startLabel: string | null;
  endLabel: string | null;
  attemptId: string | null;
  attemptStatus: string | null;
};

export type ScheduleDay = {
  key: string;
  weekday: string;
  day: string;
  isToday: boolean;
  isPast: boolean;
  exams: Array<{ testId: string; title: string }>;
  active: boolean;
};

export type ActivityItem = {
  id: string;
  activity: PointActivity;
  label: string;
  detail: string | null;
  points: number;
  occurredAt: string;
};

function metaNumber(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object") return null;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function activityLabel(activity: PointActivity, metadata: unknown, testTitle: string | null) {
  switch (activity) {
    case "PRACTICE_COMPLETED": {
      const questions = metaNumber(metadata, "questions");
      const correct = metaNumber(metadata, "correct");
      return { label: "Completed a practice quiz", detail: questions !== null && correct !== null ? `${correct}/${questions} correct` : null };
    }
    case "LIVE_EXAM_COMPLETED":
      return { label: "Completed a live exam", detail: testTitle };
    case "EXAM_SUBMITTED":
      return { label: "Submitted an exam", detail: testTitle };
    case "PERFORMANCE_BONUS": {
      const percentage = metaNumber(metadata, "percentage");
      return { label: "Performance bonus", detail: percentage !== null ? `${Math.round(percentage)}% score` : testTitle };
    }
    case "STREAK_MILESTONE": {
      const days = metaNumber(metadata, "days");
      return { label: days ? `${days}-day streak milestone` : "Streak milestone", detail: null };
    }
    case "PROFILE_COMPLETED":
      return { label: "Completed your profile", detail: null };
    default:
      return { label: "Daily activity reward", detail: null };
  }
}

/** Goals are views over existing reward rules; nothing here awards points. */
function dailyAndWeeklyGoals(
  ledger: Array<{ activity: PointActivity; points: number; occurredAt: Date }>,
  currentStreak: number,
  now: Date,
) {
  const dayAgo = now.getTime() - DAY_MS;
  const daily = ledger.find((row) => row.activity === "DAILY_ACTIVITY" && row.occurredAt.getTime() > dayAgo);
  const practiceRewarded = Math.min(
    ledger.filter((row) => row.activity === "PRACTICE_COMPLETED" && row.points > 0 && row.occurredAt.getTime() > dayAgo).length,
    POINT_RULES.PRACTICE_REWARDS_PER_DAY,
  );
  const milestone = STREAK_MILESTONES.find((row) => currentStreak < row.days) ?? null;
  const previousDays = milestone ? [...STREAK_MILESTONES].reverse().find((row) => row.days < milestone.days)?.days ?? 0 : 0;
  return {
    daily: {
      activityDone: Boolean(daily),
      activityReward: POINT_RULES.DAILY_ACTIVITY,
      activityResetsInHours: daily ? Math.max(1, Math.ceil((daily.occurredAt.getTime() + DAY_MS - now.getTime()) / 3_600_000)) : null,
      practiceRewarded,
      practiceCap: POINT_RULES.PRACTICE_REWARDS_PER_DAY,
      practiceReward: POINT_RULES.PRACTICE_COMPLETED,
      completed: Boolean(daily) && practiceRewarded >= POINT_RULES.PRACTICE_REWARDS_PER_DAY,
    },
    weekly: milestone
      ? { targetDays: milestone.days, reward: milestone.points, progressDays: currentStreak, fromDays: previousDays, completed: false }
      : { targetDays: STREAK_MILESTONES[STREAK_MILESTONES.length - 1].days, reward: 0, progressDays: currentStreak, fromDays: 0, completed: true },
  };
}

export const studentDashboardService = {
  async load(studentId: string) {
    const now = new Date();
    const since = new Date(now.getTime() - (SCHEDULE_PAST_DAYS + 1) * DAY_MS);

    const [profile, assignments, stats, attempts, summary, ledger] = await Promise.all([
      getStudentPortalContext(studentId),
      testService.forStudent(studentId),
      analyticsService.student(studentId),
      db.studentTestAttempt.findMany({ where: { studentId }, select: { id: true, testId: true, status: true } }),
      getStudentGamificationSummary(studentId),
      gamificationService.recentActivity(studentId, since),
    ]);

    const attemptByTest = new Map(attempts.map((row) => [row.testId, row]));
    const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", { timeZone: STREAK_TIME_ZONE, dateStyle: "medium", timeStyle: "short" });
    const exams: DashboardExam[] = assignments
      .map((row) => ({ row, window: examWindow(row.test) }))
      .filter((item): item is { row: (typeof assignments)[number]; window: "LIVE" | "LOCKED" } => item.window === "LIVE" || item.window === "LOCKED")
      .sort((a, b) => {
        if (a.window !== b.window) return a.window === "LIVE" ? -1 : 1;
        const aStart = a.row.test.startAt ? a.row.test.startAt.getTime() : Number.MAX_SAFE_INTEGER;
        const bStart = b.row.test.startAt ? b.row.test.startAt.getTime() : Number.MAX_SAFE_INTEGER;
        return aStart - bStart;
      })
      .map(({ row, window }) => {
        const attempt = attemptByTest.get(row.testId);
        return {
          assignmentId: row.id,
          testId: row.testId,
          title: row.test.title,
          className: row.test.class.name,
          subject: row.test.subject?.name ?? row.test.class.subject,
          window,
          questionCount: row.test._count.questions,
          durationMinutes: row.test.durationMinutes,
          startAt: row.test.startAt?.toISOString() ?? null,
          endAt: row.test.endAt?.toISOString() ?? null,
          startLabel: row.test.startAt ? dateTimeFormatter.format(row.test.startAt) : null,
          endLabel: row.test.endAt ? dateTimeFormatter.format(row.test.endAt) : null,
          attemptId: attempt?.id ?? null,
          attemptStatus: attempt?.status ?? null,
        };
      });

    const weekdayFormatter = new Intl.DateTimeFormat("en-IN", { timeZone: STREAK_TIME_ZONE, weekday: "short" });
    const dayFormatter = new Intl.DateTimeFormat("en-IN", { timeZone: STREAK_TIME_ZONE, day: "numeric" });
    const todayKey = streakDayKey(now);
    const examsByDay = new Map<string, Array<{ testId: string; title: string }>>();
    for (const row of assignments) {
      if (!row.test.startAt) continue;
      const key = streakDayKey(row.test.startAt);
      const list = examsByDay.get(key) ?? [];
      if (!list.some((item) => item.testId === row.testId)) list.push({ testId: row.testId, title: row.test.title });
      examsByDay.set(key, list);
    }
    const activeDays = new Set(ledger.filter((row) => QUALIFYING.includes(row.activity)).map((row) => streakDayKey(row.occurredAt)));
    const schedule: ScheduleDay[] = [];
    for (let offset = -SCHEDULE_PAST_DAYS; offset <= SCHEDULE_FUTURE_DAYS; offset += 1) {
      const date = new Date(now.getTime() + offset * DAY_MS);
      const key = streakDayKey(date);
      schedule.push({
        key,
        weekday: weekdayFormatter.format(date),
        day: dayFormatter.format(date),
        isToday: key === todayKey,
        isPast: offset < 0,
        exams: examsByDay.get(key) ?? [],
        active: activeDays.has(key),
      });
    }

    const testIds = [...new Set(ledger.map((row) => row.sourceId).filter((id): id is string => Boolean(id)))];
    const tests = testIds.length
      ? await db.test.findMany({ where: { id: { in: testIds }, assignments: { some: { studentId } } }, select: { id: true, title: true } })
      : [];
    const titleById = new Map(tests.map((row) => [row.id, row.title]));
    const activity: ActivityItem[] = ledger.slice(0, 5).map((row) => ({
      id: row.id,
      activity: row.activity,
      ...activityLabel(row.activity, row.metadata, row.sourceId ? titleById.get(row.sourceId) ?? null : null),
      points: row.points,
      occurredAt: row.occurredAt.toISOString(),
    }));

    const dayAgo = now.getTime() - DAY_MS;
    const practice = ledger.filter((row) => row.activity === "PRACTICE_COMPLETED");
    const practiceQuestions = practice.reduce((sum, row) => sum + (metaNumber(row.metadata, "questions") ?? 0), 0);
    const practiceCorrect = practice.reduce((sum, row) => sum + (metaNumber(row.metadata, "correct") ?? 0), 0);

    return {
      generatedAt: now.getTime(),
      profile,
      summary,
      exams,
      schedule,
      activity,
      stats: {
        attempted: stats.attempted,
        averageScore: stats.averageScore,
        highestScore: stats.highestScore,
        recentResults: stats.history.slice(0, 5).map((row) => ({
          id: row.id,
          title: row.test.title,
          submittedAt: (row.submittedAt ?? row.startedAt).toISOString(),
          score: row.score,
          totalQuestions: row.totalQuestions,
          percentage: row.percentage,
        })),
      },
      progress: {
        practiceRewardedLast24h: practice.filter((row) => row.points > 0 && row.occurredAt.getTime() > dayAgo).length,
        practiceRewardCap: POINT_RULES.PRACTICE_REWARDS_PER_DAY,
        practiceSessionsThisWeek: practice.length,
        practiceQuestionsThisWeek: practiceQuestions,
        practiceAccuracyThisWeek: practiceQuestions ? Math.round((practiceCorrect / practiceQuestions) * 100) : null,
        lastPractice: practice[0]
          ? {
              occurredAt: practice[0].occurredAt.toISOString(),
              questions: metaNumber(practice[0].metadata, "questions"),
              correct: metaNumber(practice[0].metadata, "correct"),
            }
          : null,
        pointsThisWeek: ledger.reduce((sum, row) => sum + row.points, 0),
        activeDaysThisWeek: [...activeDays].filter((key) => key <= todayKey).length,
      },
      goals: dailyAndWeeklyGoals(ledger, summary.currentStreak, now),
      todayLabel: new Intl.DateTimeFormat("en-GB", { timeZone: STREAK_TIME_ZONE, day: "numeric", month: "long", year: "numeric" }).format(now),
    };
  },
};

export type StudentDashboardData = Awaited<ReturnType<typeof studentDashboardService.load>>;
