import type { NotificationType } from "@prisma/client";

export const NOTIFICATIONS_UPDATED_EVENT = "student-notifications-updated";

export function notifyNotificationsUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
  }
}

export function notificationTypeLabel(type: NotificationType | string) {
  switch (type) {
    case "EXAM_SCHEDULED":
      return "Exam scheduled";
    case "EXAM_RESCHEDULED":
      return "Exam rescheduled";
    case "EXAM_REMINDER_1D":
      return "1-day reminder";
    case "EXAM_REMINDER_1H":
      return "1-hour reminder";
    case "EXAM_REMINDER_15M":
      return "15-minute reminder";
    case "EXAM_LIVE":
      return "Exam live";
    case "RESULT_AVAILABLE":
      return "Result";
    default:
      return "Update";
  }
}

export function notificationTypeTone(type: NotificationType | string): "purple" | "amber" | "teal" | "green" | "slate" {
  switch (type) {
    case "EXAM_LIVE":
      return "teal";
    case "EXAM_RESCHEDULED":
      return "amber";
    case "RESULT_AVAILABLE":
      return "green";
    case "EXAM_SCHEDULED":
      return "purple";
    default:
      return "slate";
  }
}

export function formatNoticeTime(value: string | Date) {
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export type StudentNotice = {
  id: string;
  title: string;
  body: string;
  type: string;
  readAt: string | Date | null;
  createdAt: string | Date;
  testId: string | null;
  resultAttemptId?: string | null;
  test?: {
    id: string;
    title: string;
    classId: string;
    class: { name: string; subject: string };
  } | null;
};

export function noticeHref(item: StudentNotice) {
  if (item.type === "RESULT_AVAILABLE" && item.resultAttemptId) {
    return { href: `/student/results/${item.resultAttemptId}`, label: "View result" };
  }
  if (item.type === "RESULT_AVAILABLE") {
    return { href: "/student/results", label: "View results" };
  }
  if (item.testId) {
    return { href: `/student/tests/${item.testId}`, label: "View exam" };
  }
  return null;
}
