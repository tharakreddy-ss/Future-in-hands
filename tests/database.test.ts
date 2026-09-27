import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { db } from "../lib/db";
import { requireClassAccess, requireTestAccess, requireAttemptAccess } from "../lib/resource-access";
import { answerService } from "../services/answer.service";
import { resultService } from "../services/result.service";
import { attemptService } from "../services/attempt.service";
import { assignmentService } from "../services/assignment.service";
import { notificationService } from "../services/notification.service";
import type { SessionUser } from "../types";

test("database: tenant isolation, exam ownership, timing, submission races and notices", { skip: !process.env.DATABASE_URL }, async () => {
  const marker = `integration-${randomUUID()}`;
  const institutionIds: string[] = [];
  try {
    const one = await db.institution.create({ data: { name: marker, slug: marker } }); institutionIds.push(one.id);
    const two = await db.institution.create({ data: { name: `${marker}-other`, slug: `${marker}-other` } }); institutionIds.push(two.id);
    const cls = await db.class.create({ data: { institutionId: one.id, name: "Test", subject: "Science" } });
    const admin: SessionUser = { id: "test-admin", name: "Admin", email: "test@example.invalid", role: "INSTITUTION_ADMIN", institutionId: two.id, studentId: null, studentIdentifier: null };
    await assert.rejects(() => requireClassAccess(admin, cls.id));
    const user = await db.user.create({ data: { name: "Test Student", email: `${marker}@example.invalid`, passwordHash: "unusable-test-account", role: "STUDENT", institutionId: one.id } });
    const student = await db.student.create({ data: { institutionId: one.id, userId: user.id, studentIdentifier: marker, firstName: "Test", lastName: "Student", email: user.email } });
    await db.classStudent.create({ data: { classId: cls.id, studentId: student.id } });
    const q = await db.question.create({ data: { institutionId: one.id, classId: cls.id, questionText: "Which answer is correct?", questionHash: marker, optionsJson: [{ key: "A", text: "Correct" }, { key: "B", text: "Wrong" }, { key: "C", text: "Wrong two" }, { key: "D", text: "Wrong three" }], correctAnswer: "A" } });
    const exam = await db.test.create({ data: { institutionId: one.id, classId: cls.id, title: marker, totalQuestions: 1, durationMinutes: 5, status: "PUBLISHED", startAt: new Date(Date.now() - 1000), endAt: new Date(Date.now() + 600000), questions: { create: { questionId: q.id, questionOrder: 0, optionOrderJson: ["D", "A", "B", "C"] } } } });
    await assert.rejects(() => requireTestAccess(admin, exam.id));
    await assert.rejects(() => assignmentService.assignToStudents(exam.id, ["other-student"]));
    const [assignment] = await assignmentService.assignToStudents(exam.id, [student.id]);
    assert.equal((assignment.questionOrderJson as string[]).length, 1);
    const attempt = await attemptService.start(assignment.id, student.id); assert.ok(attempt);
    await assert.rejects(() => requireAttemptAccess(admin, attempt.id));
    await assert.rejects(() => answerService.save({ attemptId: attempt.id, questionId: q.id, selectedAnswer: "A" }, "someone-else"));
    await assert.rejects(() => answerService.save({ attemptId: attempt.id, questionId: "off-paper", selectedAnswer: "A" }, student.id));
    await assert.rejects(() => answerService.save({ attemptId: attempt.id, questionId: q.id, selectedAnswer: "Z" }, student.id));
    const saved = await answerService.save({ attemptId: attempt.id, questionId: q.id, selectedAnswer: "A" }, student.id);
    assert.equal("isCorrect" in saved, false);
    const [first, repeated] = await Promise.all([resultService.grade(attempt.id), resultService.grade(attempt.id)]);
    assert.equal(first.score, 1); assert.equal(repeated.score, 1);
    assert.equal(first.submittedAt?.getTime(), repeated.submittedAt?.getTime());
    await assert.rejects(() => answerService.save({ attemptId: attempt.id, questionId: q.id, selectedAnswer: "B" }, student.id));
    await notificationService.dispatchDue(student.id);
    await notificationService.markAllRead(student.id);
    await notificationService.dispatchDue(student.id);
    assert.equal(await notificationService.unreadCount(student.id), 0);
    // Reset only this test-owned fixture to simulate a stale browser at its duration deadline.
    await db.studentTestAttempt.update({ where: { id: attempt.id }, data: { status: "IN_PROGRESS", startedAt: new Date(Date.now() - 301000) } });
    await assert.rejects(() => answerService.save({ attemptId: attempt.id, questionId: q.id, selectedAnswer: "B" }, student.id));
    assert.equal((await db.studentTestAttempt.findUniqueOrThrow({ where: { id: attempt.id } })).status, "SUBMITTED");
    await db.test.update({ where: { id: exam.id }, data: { startAt: new Date(Date.now() + 60000) } });
    await assert.rejects(() => attemptService.start(assignment.id, student.id));
  } finally {
    await db.studentAnswer.deleteMany({ where: { attempt: { student: { institutionId: { in: institutionIds } } } } });
    await db.institution.deleteMany({ where: { id: { in: institutionIds } } });
    await db.user.deleteMany({ where: { email: { startsWith: marker } } });
    await db.$disconnect();
  }
});
