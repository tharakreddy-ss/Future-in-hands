import { classRepository } from "@/repositories/class.repository";
import { db } from "@/lib/db";

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
  create(input: {
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
    return classRepository.create(input);
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
