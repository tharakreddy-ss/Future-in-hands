import { db } from "@/lib/db";

export const assignmentService = {
  async assignToStudents(testId: string, studentIds: string[]) {
    const unique = [...new Set(studentIds)];
    await db.$transaction(
      unique.map((studentId) =>
        db.testAssignment.upsert({
          where: { testId_studentId: { testId, studentId } },
          update: {},
          create: { testId, studentId, status: "ASSIGNED" },
        }),
      ),
    );
    return db.testAssignment.findMany({ where: { testId } });
  },
  async assignToClass(testId: string, classId: string) {
    const students = await db.classStudent.findMany({
      where: { classId, student: { status: "ACTIVE" } },
      select: { studentId: true },
    });
    return this.assignToStudents(
      testId,
      students.map((row) => row.studentId),
    );
  },
  list(testId: string) {
    return db.testAssignment.findMany({
      where: { testId },
      include: { student: true },
      orderBy: { assignedAt: "desc" },
    });
  },
};
