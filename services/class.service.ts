import { classRepository } from "@/repositories/class.repository";
import { db } from "@/lib/db";
import { httpError } from "@/lib/utils";

export const classService = {
  list(institutionId: string) {
    return classRepository.list(institutionId);
  },
  get(id: string, institutionId?: string | null) {
    return classRepository.get(id).then((cls) => {
      if (!cls) return null;
      if (institutionId && cls.institutionId !== institutionId) return null;
      return cls;
    });
  },
  async create(input: {
    institutionId: string;
    name: string;
    description?: string;
    academicYear: string;
    groupName: string;
    section?: string;
    subjectIds: string[];
    createdById?: string;
  }) {
    const subjects = await db.subject.findMany({
      where: { institutionId: input.institutionId, id: { in: input.subjectIds } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    if (subjects.length !== input.subjectIds.length) {
      throw httpError("One or more selected subjects are not available.", 400);
    }
    return db.class.create({
      data: {
        institutionId: input.institutionId,
        name: input.name,
        description: input.description?.trim() || null,
        academicYear: input.academicYear,
        groupName: input.groupName,
        section: input.section?.trim() || null,
        createdById: input.createdById,
        subject: subjects.map((subject) => subject.name).join(", "),
        subjects: { create: subjects.map((subject) => ({ subjectId: subject.id })) },
      },
      include: {
        subjects: { include: { subject: { select: { id: true, name: true } } } },
        _count: { select: { enrollments: true, tests: true, questions: true } },
      },
    });
  },
  async performance(classId: string) {
    const attempts = await db.studentTestAttempt.findMany({
      where: { test: { classId }, status: "SUBMITTED" },
      include: { student: true, test: true },
    });
    const scores = attempts.map((attempt) => attempt.percentage);
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return { attempts: attempts.length, averagePercent: avg, scores };
  },
};
