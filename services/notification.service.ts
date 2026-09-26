import { db } from "@/lib/db";
import type { NotificationType } from "@prisma/client";

async function upsertNotice(input: {
  institutionId: string;
  studentId: string;
  testId: string;
  type: NotificationType;
  title: string;
  body: string;
}) {
  return db.notification.upsert({
    where: {
      studentId_testId_type: {
        studentId: input.studentId,
        testId: input.testId,
        type: input.type,
      },
    },
    update: input.type === "EXAM_RESCHEDULED" ? { title: input.title, body: input.body, readAt: null } : {},
    create: input,
  });
}

export const notificationService = {
  list(studentId: string) {
    return db.notification.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      take: 40,
    });
  },

  unreadCount(studentId: string) {
    return db.notification.count({ where: { studentId, readAt: null } });
  },

  async markRead(id: string, studentId: string) {
    return db.notification.updateMany({
      where: { id, studentId },
      data: { readAt: new Date() },
    });
  },

  async markAllRead(studentId: string) {
    return db.notification.updateMany({
      where: { studentId, readAt: null },
      data: { readAt: new Date() },
    });
  },

  async notifyExamScheduled(testId: string) {
    const test = await db.test.findUnique({
      where: { id: testId },
      include: { assignments: true, class: true },
    });
    if (!test) return;
    const when = test.startAt?.toLocaleString() ?? "soon";
    for (const row of test.assignments) {
      await upsertNotice({
        institutionId: test.institutionId,
        studentId: row.studentId,
        testId: test.id,
        type: "EXAM_SCHEDULED",
        title: "New exam scheduled",
        body: `${test.title} for ${test.class.name} starts on ${when}.`,
      });
    }
  },

  async notifyExamRescheduled(testId: string) {
    const test = await db.test.findUnique({
      where: { id: testId },
      include: { assignments: true, class: true },
    });
    if (!test) return;
    const when = test.startAt?.toLocaleString() ?? "a new time";
    for (const row of test.assignments) {
      await upsertNotice({
        institutionId: test.institutionId,
        studentId: row.studentId,
        testId: test.id,
        type: "EXAM_RESCHEDULED",
        title: "Exam rescheduled",
        body: `${test.title} now starts on ${when}.`,
      });
    }
  },

  async dispatchDue(studentId: string) {
    const assignments = await db.testAssignment.findMany({
      where: { studentId },
      include: { test: true, student: true },
    });
    const now = Date.now();
    for (const row of assignments) {
      const test = row.test;
      if (!test.startAt || !test.endAt || test.status !== "PUBLISHED") continue;
      const start = test.startAt.getTime();
      const end = test.endAt.getTime();
      const mins = (start - now) / 60000;
      if (now >= start && now < end) {
        await upsertNotice({
          institutionId: test.institutionId,
          studentId,
          testId: test.id,
          type: "EXAM_LIVE",
          title: "Exam is live",
          body: `${test.title} is now open. Start your attempt.`,
        });
      } else if (mins <= 15 && mins > 0) {
        await upsertNotice({
          institutionId: test.institutionId,
          studentId,
          testId: test.id,
          type: "EXAM_REMINDER_15M",
          title: "Exam starts in 15 minutes",
          body: `${test.title} begins shortly.`,
        });
      } else if (mins <= 60 && mins > 15) {
        await upsertNotice({
          institutionId: test.institutionId,
          studentId,
          testId: test.id,
          type: "EXAM_REMINDER_1H",
          title: "Exam starts in 1 hour",
          body: `${test.title} starts in about an hour.`,
        });
      } else if (mins <= 60 * 24 && mins > 60) {
        await upsertNotice({
          institutionId: test.institutionId,
          studentId,
          testId: test.id,
          type: "EXAM_REMINDER_1D",
          title: "Exam tomorrow",
          body: `${test.title} is scheduled within 24 hours.`,
        });
      }
    }

    const submitted = await db.studentTestAttempt.findMany({
      where: { studentId, status: "SUBMITTED" },
      include: { test: true },
    });
    for (const attempt of submitted) {
      await upsertNotice({
        institutionId: attempt.test.institutionId,
        studentId,
        testId: attempt.testId,
        type: "RESULT_AVAILABLE",
        title: "Result available",
        body: `Your result for ${attempt.test.title} is ready.`,
      });
    }
  },
};
