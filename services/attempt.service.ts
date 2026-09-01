import { attemptRepository } from "@/repositories/attempt.repository";
import { db } from "@/lib/db";
import { resultService } from "@/services/result.service";
import { examService } from "@/services/exam.service";
import { examWindow } from "@/lib/exam-window";

export const attemptService = {
  remainingUntilClose(test: { endAt?: Date | string | null; durationMinutes: number }, remainingSeconds: number) {
    if (!test.endAt) return remainingSeconds;
    const untilClose = Math.floor((new Date(test.endAt).getTime() - Date.now()) / 1000);
    return Math.max(0, Math.min(remainingSeconds, untilClose));
  },

  async get(id: string) {
    const attempt = await attemptRepository.get(id);
    if (!attempt) return null;
    await examService.syncWindows(attempt.test.institutionId);
    const remaining = this.remainingUntilClose(attempt.test, attempt.remainingSeconds);
    if (
      (examWindow(attempt.test) === "CLOSED" || remaining <= 0) &&
      attempt.status === "IN_PROGRESS"
    ) {
      await resultService.grade(attempt.id);
      return this.reorder(await attemptRepository.get(id));
    }
    const reordered = this.reorder(attempt);
    if (!reordered) return null;
    return { ...reordered, remainingSeconds: remaining };
  },

  reorder(attempt: Awaited<ReturnType<typeof attemptRepository.get>>) {
    if (!attempt?.assignment) return attempt;
    const order = (attempt.assignment.questionOrderJson as string[] | null) ?? [];
    if (!order.length) return attempt;
    const byId = new Map(attempt.test.questions.map((item) => [item.questionId, item]));
    const optionMap = (attempt.assignment.optionOrderJson as Record<string, string[]>) ?? {};
    const questions = order.flatMap((id) => {
      const item = byId.get(id);
      if (!item) return [];
      return [{ ...item, optionOrderJson: optionMap[id] ?? item.optionOrderJson }];
    });
    return { ...attempt, test: { ...attempt.test, questions } };
  },

  async start(assignmentId: string, studentId: string) {
    const assignment = await db.testAssignment.findUnique({
      where: { id: assignmentId },
      include: { test: true, student: true },
    });
    if (!assignment || assignment.studentId !== studentId) {
      throw Object.assign(new Error("Assignment not found"), { status: 404 });
    }
    if (assignment.student.institutionId !== assignment.test.institutionId) {
      throw Object.assign(new Error("Forbidden"), { status: 403 });
    }
    await examService.syncWindows(assignment.test.institutionId);
    const window = examWindow(assignment.test);
    if (window === "LOCKED") {
      throw Object.assign(new Error("This exam is locked until the scheduled start time"), { status: 403 });
    }
    if (window === "CLOSED") {
      throw Object.assign(new Error("This exam is closed"), { status: 403 });
    }
    if (assignment.test.status !== "PUBLISHED") {
      throw Object.assign(new Error("Test is not available"), { status: 400 });
    }

    const existing = await attemptRepository.findByStudentTest(studentId, assignment.testId);
    if (existing) return this.get(existing.id);

    const created = await db.$transaction(async (tx) => {
      await tx.testAssignment.update({
        where: { id: assignment.id },
        data: { status: "STARTED" },
      });
      return tx.studentTestAttempt.create({
        data: {
          studentId,
          testId: assignment.testId,
          assignmentId: assignment.id,
          totalQuestions: assignment.test.totalQuestions,
          remainingSeconds: assignment.test.durationMinutes * 60,
          status: "IN_PROGRESS",
        },
      });
    });
    return this.get(created.id);
  },

  async submit(attemptId: string) {
    await resultService.grade(attemptId);
    return this.get(attemptId);
  },
};
