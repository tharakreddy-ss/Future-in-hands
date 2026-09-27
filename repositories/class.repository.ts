import { db } from "@/lib/db";

export const classRepository = {
  list(institutionId: string) {
    return db.class.findMany({
      where: { institutionId },
      include: {
        _count: { select: { enrollments: true, tests: true, questions: true } },
      },
      orderBy: [{ academicYear: "asc" }, { groupName: "asc" }, { name: "asc" }],
    });
  },
  get(id: string) {
    return db.class.findUnique({
      where: { id },
      include: {
        enrollments: { include: { student: true } },
        syllabuses: { include: { topics: true } },
        _count: { select: { questions: true, tests: true, enrollments: true } },
      },
    });
  },
  create(data: {
    institutionId: string;
    name: string;
    subject: string;
    description?: string;
    academicYear: string;
    groupName: string;
    section?: string;
    program?: string;
    createdById?: string;
  }) {
    return db.class.create({ data });
  },
};
