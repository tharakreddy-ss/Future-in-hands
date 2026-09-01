import { testRepository } from "@/repositories/test.repository";
import { db } from "@/lib/db";

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
    return testRepository.create({
      institutionId: cls.institutionId,
      classId: input.classId,
      syllabusId: input.syllabusId,
      title: input.title,
      durationMinutes: input.durationMinutes,
      totalQuestions: input.totalQuestions ?? input.questionIds?.length ?? 0,
      createdById: input.createdById,
      questionIds: input.questionIds,
    });
  },
  publish(id: string) {
    return testRepository.publish(id);
  },
  async forStudent(studentId: string) {
    return db.testAssignment.findMany({
      where: { studentId },
      include: {
        test: {
          include: {
            class: true,
            _count: { select: { questions: true } },
          },
        },
      },
      orderBy: { assignedAt: "desc" },
    });
  },
};
