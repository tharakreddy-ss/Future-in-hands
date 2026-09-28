import { testRepository } from "@/repositories/test.repository";
import { db } from "@/lib/db";

const studentAssignmentInclude = {
  test: {
    include: {
      class: true,
      subject: true,
      _count: { select: { questions: true } },
    },
  },
} as const;

export const testService = {
  list(classId: string) {
    return testRepository.list(classId);
  },
  get(id: string) {
    return testRepository.get(id);
  },
  async create(input: {
    classId: string;
    title: string;
    durationMinutes: number;
    totalQuestions?: number;
    questionIds?: string[];
    syllabusId?: string;
    createdById?: string;
  }) {
    const cls = await db.class.findUnique({ where: { id: input.classId } });
    if (!cls) throw Object.assign(new Error("Class not found"), { status: 404 });
    const questionIds = [...new Set(input.questionIds ?? [])];
    const count = await db.question.count({ where: { id: { in: questionIds }, classId: cls.id, institutionId: cls.institutionId } });
    if (count !== questionIds.length) throw Object.assign(new Error("Questions must belong to this class"), { status: 400 });
    return testRepository.create({
      institutionId: cls.institutionId,
      classId: input.classId,
      syllabusId: input.syllabusId,
      title: input.title,
      durationMinutes: input.durationMinutes,
      totalQuestions: questionIds.length,
      createdById: input.createdById,
      questionIds,
    });
  },
  async publish(id: string) {
    const test = await db.test.findUnique({ where: { id }, include: { _count: { select: { questions: true } } } });
    if (!test?._count.questions) throw Object.assign(new Error("Add questions before publishing"), { status: 400 });
    return testRepository.publish(id);
  },
  async forStudent(studentId: string) {
    return db.testAssignment.findMany({
      where: { studentId },
      include: studentAssignmentInclude,
      orderBy: { assignedAt: "desc" },
    });
  },
  forStudentInClass(studentId: string, classId: string) {
    return db.testAssignment.findMany({
      where: { studentId, test: { classId } },
      include: studentAssignmentInclude,
      orderBy: { assignedAt: "desc" },
    });
  },
};
