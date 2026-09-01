export type ExamWindow = "LOCKED" | "LIVE" | "CLOSED";

export function examWindow(test: {
  status: string;
  startAt?: Date | string | null;
  endAt?: Date | string | null;
  now?: Date;
}): ExamWindow {
  const now = (test.now ?? new Date()).getTime();
  if (test.status !== "PUBLISHED") return "LOCKED";
  if (!test.startAt || !test.endAt) return "LIVE";
  const start = new Date(test.startAt).getTime();
  const end = new Date(test.endAt).getTime();
  if (now < start) return "LOCKED";
  if (now >= end) return "CLOSED";
  return "LIVE";
}

export function examStatusFromWindow(window: ExamWindow, published: boolean): "DRAFT" | "SCHEDULED" | "LIVE" | "CLOSED" {
  if (!published) return "DRAFT";
  if (window === "LOCKED") return "SCHEDULED";
  if (window === "LIVE") return "LIVE";
  return "CLOSED";
}

export function startsInMs(startAt?: Date | string | null, now = new Date()) {
  if (!startAt) return 0;
  return Math.max(0, new Date(startAt).getTime() - now.getTime());
}

export function validateSchedule(startAt: Date, endAt: Date, durationMinutes: number) {
  if (!(startAt < endAt)) throw Object.assign(new Error("Start time must be before end time"), { status: 400 });
  const windowMinutes = (endAt.getTime() - startAt.getTime()) / 60000;
  if (durationMinutes > windowMinutes + 0.01) {
    throw Object.assign(new Error("Duration must fit inside the exam window"), { status: 400 });
  }
}
