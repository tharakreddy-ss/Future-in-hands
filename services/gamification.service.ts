import { Prisma, type PointActivity, type StudentGamification } from "@prisma/client";
import { db } from "@/lib/db";

export const POINT_RULES = {
  DAILY_ACTIVITY: 5,
  PRACTICE_COMPLETED: 10,
  PRACTICE_REWARDS_PER_DAY: 3,
  EXAM_SUBMITTED: 20,
  LIVE_EXAM_COMPLETED: 25,
  PROFILE_COMPLETED: 20,
} as const;

/** Highest matching tier only. */
export const PERFORMANCE_BONUS: ReadonlyArray<{ minPercentage: number; points: number }> = [
  { minPercentage: 95, points: 15 },
  { minPercentage: 85, points: 10 },
  { minPercentage: 70, points: 5 },
];

export const STREAK_MILESTONES: ReadonlyArray<{ days: number; points: number }> = [
  { days: 7, points: 50 },
  { days: 14, points: 100 },
  { days: 30, points: 250 },
];

const STREAK_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Calendar used only to decide when a continuing streak gains a day; continuity itself is a rolling 24h window. */
const STREAK_TIME_ZONE = resolveTimeZone(process.env.STREAK_TIME_ZONE);

function resolveTimeZone(value: string | undefined) {
  const zone = value?.trim() || "Asia/Kolkata";
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: zone });
    return zone;
  } catch {
    return "Asia/Kolkata";
  }
}

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: STREAK_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function dayKey(date: Date) {
  return dayFormatter.format(date);
}

export { STREAK_TIME_ZONE, dayKey as streakDayKey };

type Tx = Prisma.TransactionClient;

type LedgerEntry = {
  activity: PointActivity;
  points: number;
  eventKey: string;
  sourceId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

type ActivityInput = LedgerEntry & {
  studentId: string;
  institutionId: string;
  occurredAt: Date;
  /** Counts toward the streak and the daily activity reward. */
  qualifying: boolean;
  extras?: LedgerEntry[];
};

type StreakState = Pick<StudentGamification, "currentStreak" | "longestStreak" | "lastActivityAt" | "streakStartedAt">;

function advanceStreak(state: StreakState, at: Date) {
  const last = state.lastActivityAt;
  if (!last || at.getTime() - last.getTime() > STREAK_WINDOW_MS) {
    return { previous: 0, currentStreak: 1, streakStartedAt: at, lastActivityAt: at, longestStreak: Math.max(state.longestStreak, 1) };
  }
  if (at.getTime() <= last.getTime()) {
    return {
      previous: state.currentStreak,
      currentStreak: state.currentStreak,
      streakStartedAt: state.streakStartedAt ?? last,
      lastActivityAt: last,
      longestStreak: state.longestStreak,
    };
  }
  const currentStreak = dayKey(at) === dayKey(last) ? state.currentStreak : state.currentStreak + 1;
  return {
    previous: state.currentStreak,
    currentStreak,
    streakStartedAt: state.streakStartedAt ?? last,
    lastActivityAt: at,
    longestStreak: Math.max(state.longestStreak, currentStreak),
  };
}

function streakHoursLeft(lastActivityAt: Date | null | undefined, streak: number, now: Date) {
  if (!lastActivityAt || streak <= 0) return null;
  const remaining = lastActivityAt.getTime() + STREAK_WINDOW_MS - now.getTime();
  return remaining > 0 ? Math.max(1, Math.ceil(remaining / (60 * 60 * 1000))) : null;
}

/** A streak is broken once more than 24 hours pass without a qualifying activity. */
export function effectiveStreak(state: Pick<StudentGamification, "currentStreak" | "lastActivityAt"> | null | undefined, now = new Date()) {
  if (!state?.lastActivityAt) return 0;
  return now.getTime() - state.lastActivityAt.getTime() > STREAK_WINDOW_MS ? 0 : state.currentStreak;
}

async function lockState(tx: Tx, studentId: string) {
  await tx.studentGamification.upsert({ where: { studentId }, create: { studentId }, update: {} });
  await tx.$queryRaw`SELECT student_id FROM student_gamification WHERE student_id = ${studentId} FOR UPDATE`;
  return tx.studentGamification.findUniqueOrThrow({ where: { studentId } });
}

async function recordActivity(input: ActivityInput) {
  try {
    return await db.$transaction(async (tx) => {
      const state = await lockState(tx, input.studentId);
      const exists = await tx.studentPointEvent.findUnique({ where: { eventKey: input.eventKey }, select: { id: true } });
      if (exists) return false;

      const at = input.occurredAt;
      const windowStart = new Date(at.getTime() - STREAK_WINDOW_MS);
      let points = input.points;
      if (input.activity === "PRACTICE_COMPLETED") {
        const rewarded = await tx.studentPointEvent.count({
          where: {
            studentId: input.studentId,
            activity: "PRACTICE_COMPLETED",
            points: { gt: 0 },
            occurredAt: { gt: windowStart, lte: at },
          },
        });
        if (rewarded >= POINT_RULES.PRACTICE_REWARDS_PER_DAY) points = 0;
      }

      const entries: LedgerEntry[] = [{ ...input, points }, ...(input.extras ?? [])];
      let streakUpdate: ReturnType<typeof advanceStreak> | null = null;

      if (input.qualifying) {
        const recentDaily = await tx.studentPointEvent.findFirst({
          where: { studentId: input.studentId, activity: "DAILY_ACTIVITY", occurredAt: { gt: windowStart, lte: at } },
          select: { id: true },
        });
        if (!recentDaily) {
          entries.push({ activity: "DAILY_ACTIVITY", points: POINT_RULES.DAILY_ACTIVITY, eventKey: `daily:${input.eventKey}` });
        }

        streakUpdate = advanceStreak(state, at);
        const runKey = streakUpdate.streakStartedAt.getTime();
        const reached = STREAK_MILESTONES.filter(
          (milestone) => streakUpdate!.previous < milestone.days && streakUpdate!.currentStreak >= milestone.days,
        );
        if (reached.length) {
          const keys = reached.map((milestone) => `streak:${input.studentId}:${runKey}:${milestone.days}`);
          const awarded = new Set(
            (await tx.studentPointEvent.findMany({ where: { eventKey: { in: keys } }, select: { eventKey: true } })).map((row) => row.eventKey),
          );
          reached.forEach((milestone, index) => {
            if (awarded.has(keys[index])) return;
            entries.push({
              activity: "STREAK_MILESTONE",
              points: milestone.points,
              eventKey: keys[index],
              metadata: { days: milestone.days },
            });
          });
        }
      }

      await tx.studentPointEvent.createMany({
        data: entries.map((entry) => ({
          studentId: input.studentId,
          institutionId: input.institutionId,
          activity: entry.activity,
          points: entry.points,
          eventKey: entry.eventKey,
          sourceId: entry.sourceId ?? null,
          occurredAt: at,
          metadata: entry.metadata,
        })),
      });

      const gained = entries.reduce((sum, entry) => sum + entry.points, 0);
      const lastPointsAt =
        gained > 0 && (!state.lastPointsAt || state.lastPointsAt.getTime() < at.getTime()) ? at : state.lastPointsAt;
      await tx.studentGamification.update({
        where: { studentId: input.studentId },
        data: {
          totalPoints: { increment: gained },
          lastPointsAt,
          ...(streakUpdate
            ? {
                currentStreak: streakUpdate.currentStreak,
                longestStreak: streakUpdate.longestStreak,
                lastActivityAt: streakUpdate.lastActivityAt,
                streakStartedAt: streakUpdate.streakStartedAt,
              }
            : {}),
        },
      });
      return true;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return false;
    throw error;
  }
}

function performanceBonus(percentage: number) {
  return PERFORMANCE_BONUS.find((tier) => percentage >= tier.minPercentage)?.points ?? 0;
}

async function recordExamAttempt(attemptId: string) {
  const attempt = await db.studentTestAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      studentId: true,
      testId: true,
      status: true,
      submittedAt: true,
      percentage: true,
      correctAnswers: true,
      wrongAnswers: true,
      student: { select: { institutionId: true } },
      test: { select: { startAt: true, endAt: true } },
    },
  });
  if (!attempt || attempt.status !== "SUBMITTED" || !attempt.submittedAt) return false;
  if (attempt.correctAnswers + attempt.wrongAnswers === 0) return false;

  const live = Boolean(attempt.test.startAt && attempt.test.endAt);
  const percentage = Math.round(attempt.percentage * 100) / 100;
  const bonus = performanceBonus(percentage);
  return recordActivity({
    studentId: attempt.studentId,
    institutionId: attempt.student.institutionId,
    occurredAt: attempt.submittedAt,
    qualifying: true,
    activity: live ? "LIVE_EXAM_COMPLETED" : "EXAM_SUBMITTED",
    points: live ? POINT_RULES.LIVE_EXAM_COMPLETED : POINT_RULES.EXAM_SUBMITTED,
    eventKey: `exam:${attempt.id}`,
    sourceId: attempt.testId,
    metadata: { attemptId: attempt.id, percentage },
    extras: bonus
      ? [{ activity: "PERFORMANCE_BONUS", points: bonus, eventKey: `exam-bonus:${attempt.id}`, sourceId: attempt.testId, metadata: { percentage } }]
      : [],
  });
}

/** Rewards submitted attempts that predate the ledger (or whose hook failed), oldest first. */
async function syncExamHistory(studentIds: string[]) {
  if (!studentIds.length) return;
  const attempts = await db.studentTestAttempt.findMany({
    where: { studentId: { in: studentIds }, status: "SUBMITTED", submittedAt: { not: null } },
    select: { id: true, correctAnswers: true, wrongAnswers: true },
    orderBy: { submittedAt: "asc" },
  });
  const eligible = attempts.filter((row) => row.correctAnswers + row.wrongAnswers > 0);
  if (!eligible.length) return;
  const recorded = new Set(
    (
      await db.studentPointEvent.findMany({
        where: { eventKey: { in: eligible.map((row) => `exam:${row.id}`) } },
        select: { eventKey: true },
      })
    ).map((row) => row.eventKey),
  );
  for (const row of eligible) {
    if (recorded.has(`exam:${row.id}`)) continue;
    await recordExamAttempt(row.id);
  }
}

const PROFILE_FIELDS = ["photoKey", "phone", "dateOfBirth", "gender", "address", "guardianName", "guardianPhone"] as const;

async function currentEnrollment(studentId: string) {
  return db.classStudent.findFirst({
    where: { studentId },
    orderBy: [{ joinedAt: "desc" }, { id: "asc" }],
    select: {
      class: { select: { id: true, name: true, subject: true, academicYear: true, section: true, institutionId: true } },
    },
  });
}

export type LeaderboardEntry = {
  rank: number;
  studentId: string;
  name: string;
  photoUrl: string | null;
  points: number;
  streak: number;
  isCurrentStudent: boolean;
};

export type StudentGamificationSummary = {
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: string | null;
  /** Whole hours left before the active streak breaks; null when there is no active streak. */
  streakHoursLeft: number | null;
  rank: number | null;
  classSize: number;
  pointsToNextRank: number | null;
  nextRank: number | null;
  currentClass: { id: string; name: string; subject: string; academicYear: string; section: string | null } | null;
  leaderboard: LeaderboardEntry[];
};

export const gamificationService = {
  recordExamAttempt,

  async recordExamAttemptSafely(attemptId: string) {
    try {
      await recordExamAttempt(attemptId);
    } catch (error) {
      console.error("[gamification] exam reward failed", attemptId, error);
    }
  },

  async recordPracticeCompleted(input: { studentId: string; sessionId: string; classId: string; questions: number; correct: number }) {
    try {
      const student = await db.student.findUnique({ where: { id: input.studentId }, select: { institutionId: true } });
      if (!student) return;
      await syncExamHistory([input.studentId]);
      await recordActivity({
        studentId: input.studentId,
        institutionId: student.institutionId,
        occurredAt: new Date(),
        qualifying: true,
        activity: "PRACTICE_COMPLETED",
        points: POINT_RULES.PRACTICE_COMPLETED,
        eventKey: `practice:${input.sessionId}`,
        sourceId: input.classId,
        metadata: { questions: input.questions, correct: input.correct },
      });
    } catch (error) {
      console.error("[gamification] practice reward failed", input.sessionId, error);
    }
  },

  async recordProfileCompletionIfEligible(studentId: string) {
    try {
      const student = await db.student.findUnique({
        where: { id: studentId },
        select: { institutionId: true, photoKey: true, phone: true, dateOfBirth: true, gender: true, address: true, guardianName: true, guardianPhone: true },
      });
      if (!student) return;
      const complete = PROFILE_FIELDS.every((field) => {
        const value = student[field];
        return value instanceof Date || (typeof value === "string" && value.trim().length > 0);
      });
      if (!complete) return;
      await recordActivity({
        studentId,
        institutionId: student.institutionId,
        occurredAt: new Date(),
        qualifying: false,
        activity: "PROFILE_COMPLETED",
        points: POINT_RULES.PROFILE_COMPLETED,
        eventKey: `profile-complete:${studentId}`,
      });
    } catch (error) {
      console.error("[gamification] profile reward failed", studentId, error);
    }
  },

  /**
   * Ranking: total points desc, then active streak desc, then whoever reached their
   * current total first (lastPointsAt asc; students with no points last), then student id.
   */
  async summaryForStudent(studentId: string): Promise<StudentGamificationSummary> {
    const enrollment = await currentEnrollment(studentId);
    const now = new Date();

    if (!enrollment) {
      await syncExamHistory([studentId]);
      const state = await db.studentGamification.findUnique({ where: { studentId } });
      const streak = effectiveStreak(state, now);
      return {
        totalPoints: state?.totalPoints ?? 0,
        currentStreak: streak,
        longestStreak: state?.longestStreak ?? 0,
        lastActivityAt: state?.lastActivityAt?.toISOString() ?? null,
        streakHoursLeft: streakHoursLeft(state?.lastActivityAt, streak, now),
        rank: null,
        classSize: 0,
        pointsToNextRank: null,
        nextRank: null,
        currentClass: null,
        leaderboard: [],
      };
    }

    const cls = enrollment.class;
    const members = await db.classStudent.findMany({
      where: { classId: cls.id, student: { institutionId: cls.institutionId, OR: [{ status: "ACTIVE" }, { id: studentId }] } },
      select: { studentId: true },
    });
    const memberIds = members.map((row) => row.studentId);
    await syncExamHistory(memberIds);

    const students = await db.student.findMany({
      where: { id: { in: memberIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        photoKey: true,
        gamification: { select: { totalPoints: true, currentStreak: true, longestStreak: true, lastActivityAt: true, lastPointsAt: true } },
      },
    });

    const rows = students
      .map((student) => ({
        studentId: student.id,
        name: `${student.firstName} ${student.lastName}`.trim(),
        photoUrl: student.photoKey
          ? student.id === studentId
            ? "/api/student/profile/photo"
            : `/api/student/classmates/${student.id}/photo`
          : null,
        points: student.gamification?.totalPoints ?? 0,
        streak: effectiveStreak(student.gamification, now),
        longestStreak: student.gamification?.longestStreak ?? 0,
        lastActivityAt: student.gamification?.lastActivityAt ?? null,
        achievedAt: student.gamification?.lastPointsAt?.getTime() ?? Number.POSITIVE_INFINITY,
      }))
      .sort(
        (a, b) =>
          b.points - a.points ||
          b.streak - a.streak ||
          a.achievedAt - b.achievedAt ||
          (a.studentId < b.studentId ? -1 : a.studentId > b.studentId ? 1 : 0),
      );

    const leaderboard: LeaderboardEntry[] = rows.map((row, index) => ({
      rank: index + 1,
      studentId: row.studentId,
      name: row.name,
      photoUrl: row.photoUrl,
      points: row.points,
      streak: row.streak,
      isCurrentStudent: row.studentId === studentId,
    }));

    const myIndex = rows.findIndex((row) => row.studentId === studentId);
    const me = rows[myIndex];
    const ahead = myIndex > 0 ? rows[myIndex - 1] : null;

    return {
      totalPoints: me?.points ?? 0,
      currentStreak: me?.streak ?? 0,
      longestStreak: me?.longestStreak ?? 0,
      lastActivityAt: me?.lastActivityAt?.toISOString() ?? null,
      streakHoursLeft: streakHoursLeft(me?.lastActivityAt, me?.streak ?? 0, now),
      rank: myIndex >= 0 ? myIndex + 1 : null,
      classSize: rows.length,
      pointsToNextRank: me && ahead ? ahead.points - me.points + 1 : null,
      nextRank: ahead ? myIndex : null,
      currentClass: { id: cls.id, name: cls.name, subject: cls.subject, academicYear: cls.academicYear, section: cls.section },
      leaderboard,
    };
  },

  /** Read-only view of the student's own ledger since `since`, newest first. */
  recentActivity(studentId: string, since: Date) {
    return db.studentPointEvent.findMany({
      where: { studentId, occurredAt: { gte: since } },
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      select: { id: true, activity: true, points: true, occurredAt: true, sourceId: true, metadata: true },
    });
  },

  /** True only when both students are ACTIVE members of the viewer's current class in the same institution. */
  async sharesCurrentClass(viewerStudentId: string, classmateId: string) {
    const enrollment = await currentEnrollment(viewerStudentId);
    if (!enrollment) return false;
    const match = await db.classStudent.findFirst({
      where: {
        classId: enrollment.class.id,
        studentId: classmateId,
        student: { status: "ACTIVE", institutionId: enrollment.class.institutionId },
      },
      select: { id: true },
    });
    return Boolean(match);
  },
};
