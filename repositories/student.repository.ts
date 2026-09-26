import { db } from "@/lib/db";

export const studentRepository = {
  list(institutionId: string) {
    return db.student.findMany({
      where: { institutionId },
      include: { enrollments: { include: { class: true } }, attempts: true },
      orderBy: { createdAt: "desc" },
    });
  },
  get(id: string) {
    return db.student.findUnique({
      where: { id },
      include: {
        enrollments: { include: { class: true } },
        attempts: { include: { test: true }, orderBy: { startedAt: "desc" } },
        user: { select: { id: true, name: true, email: true, isActive: true } },
        institution: true,
      },
    });
  },
  search(institutionId: string, q: string) {
    const query = q.trim();
    const parts = query.split(/\s+/).filter(Boolean);
    return db.student.findMany({
      where: {
        institutionId,
        OR: [
          { studentIdentifier: { contains: query, mode: "insensitive" } },
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          ...(parts.length >= 2
            ? [
                {
                  firstName: { contains: parts[0], mode: "insensitive" as const },
                  lastName: { contains: parts.slice(1).join(" "), mode: "insensitive" as const },
                },
              ]
            : []),
        ],
      },
      include: { enrollments: { include: { class: true } } },
      orderBy: { firstName: "asc" },
      take: 8,
    });
  },
  update(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string | null;
      status?: "ACTIVE" | "INACTIVE";
    },
  ) {
    return db.student.update({ where: { id }, data });
  },
  create(data: {
    userId: string;
    institutionId: string;
    studentIdentifier: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  }) {
    return db.student.create({ data });
  },
  enroll(classId: string, studentId: string) {
    return db.classStudent.upsert({
      where: { classId_studentId: { classId, studentId } },
      update: {},
      create: { classId, studentId },
    });
  },
};
