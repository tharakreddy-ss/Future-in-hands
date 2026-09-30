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
  async update(
    id: string,
    institutionId: string,
    input: {
      name?: string;
      description?: string | null;
      academicYear?: string;
      groupName?: string;
      section?: string | null;
      subjectIds?: string[];
    },
  ) {
    const existing = await db.class.findFirst({ where: { id, institutionId }, select: { id: true } });
    if (!existing) throw httpError("Class not found", 404);
    const { subjectIds, ...fields } = input;
    return db.$transaction(async (tx) => {
      let subject: string | undefined;
      if (subjectIds) {
        const subjects = await tx.subject.findMany({
          where: { institutionId, id: { in: subjectIds } },
          select: { name: true },
          orderBy: { name: "asc" },
        });
        if (subjects.length !== subjectIds.length) {
          throw httpError("One or more selected subjects are not available.", 400);
        }
        await tx.classSubject.deleteMany({ where: { classId: id, subjectId: { notIn: subjectIds } } });
        await tx.classSubject.createMany({
          data: subjectIds.map((subjectId) => ({ classId: id, subjectId })),
          skipDuplicates: true,
        });
        subject = subjects.map((row) => row.name).join(", ");
      }
      return tx.class.update({
        where: { id },
        data: { ...fields, ...(subject !== undefined ? { subject } : {}) },
        include: { subjects: { include: { subject: { select: { id: true, name: true } } } } },
      });
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
