import { db } from "@/lib/db";
import { shuffle } from "@/lib/shuffle";
import type { QuestionOption } from "@/types";
export const assignmentService = {
  async assignToStudents(testId: string, studentIds: string[]) {
    const test = await db.test.findUnique({ where: { id: testId }, include: { questions: { include: { question: true } } } });
    if (!test) throw Object.assign(new Error("Test not found"), { status: 404 });
    const unique = [...new Set(studentIds)];
    const eligible = await db.classStudent.count({ where: { classId: test.classId, studentId: { in: unique }, student: { institutionId: test.institutionId, status: "ACTIVE" } } });
    if (eligible !== unique.length) throw Object.assign(new Error("Students must be active members of this class"), { status: 400 });
    await db.$transaction(unique.map((studentId) => {
      const optionOrder: Record<string, string[]> = {};
      for (const item of test.questions) optionOrder[item.questionId] = shuffle((item.question.optionsJson as QuestionOption[]).map((o) => o.key));
      return db.testAssignment.upsert({ where: { testId_studentId: { testId, studentId } }, update: {},
        create: { testId, studentId, status: "ASSIGNED", questionOrderJson: shuffle(test.questions.map((q) => q.questionId)), optionOrderJson: optionOrder } });
    }));
    return this.list(testId);
  },
  async assignToClass(testId: string, classId: string) {
    const students = await db.classStudent.findMany({ where: { classId, student: { status: "ACTIVE" } }, select: { studentId: true } });
    return this.assignToStudents(testId, students.map((s) => s.studentId));
  },
  list(testId: string) { return db.testAssignment.findMany({ where: { testId }, include: { student: true }, orderBy: { assignedAt: "desc" } }); },
};
