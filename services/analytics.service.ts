import { db } from "@/lib/db";

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export const analyticsService = {
  async platform() {
    const [
      institutions,
      activeInstitutions,
      admins,
      teachers,
      students,
      classes,
      tests,
      liveExams,
      attempts,
      aiQuestions,
      submitted,
    ] = await Promise.all([
      db.institution.count(),
      db.institution.count({ where: { status: "ACTIVE" } }),
      db.user.count({ where: { role: "INSTITUTION_ADMIN" } }),
      db.user.count({ where: { role: "TEACHER" } }),
      db.student.count(),
      db.class.count(),
      db.test.count(),
      db.test.count({ where: { examStatus: "LIVE" } }),
      db.studentTestAttempt.count({ where: { status: "SUBMITTED" } }),
      db.question.count({ where: { source: "AI" } }),
      db.studentTestAttempt.findMany({
        where: { status: "SUBMITTED" },
        select: { percentage: true },
      }),
    ]);

    return {
      institutions,
      activeInstitutions,
      admins,
      teachers,
      students,
      classes,
      tests,
      liveExams,
      testsGenerated: tests,
      attempts,
      aiQuestionsGenerated: aiQuestions,
      users: admins + teachers + students,
      averageScore: average(submitted.map((row) => row.percentage)),
    };
  },

  async institution(institutionId: string) {
    const [classes, students, teachers, tests, liveExams, attempts, submitted] = await Promise.all([
      db.class.count({ where: { institutionId } }),
      db.student.count({ where: { institutionId } }),
      db.user.count({ where: { institutionId, role: "TEACHER" } }),
      db.test.count({ where: { institutionId, status: "PUBLISHED" } }),
      db.test.count({ where: { institutionId, examStatus: "LIVE" } }),
      db.studentTestAttempt.count({
        where: { test: { institutionId }, status: "SUBMITTED" },
      }),
      db.studentTestAttempt.findMany({
        where: { test: { institutionId }, status: "SUBMITTED" },
        select: { percentage: true },
      }),
    ]);
    return {
      classes,
      students,
      teachers,
      tests,
      liveExams,
      attempts,
      averageScore: average(submitted.map((row) => row.percentage)),
      completionRate: students ? Math.round((attempts / Math.max(students, 1)) * 100) : 0,
    };
  },

  async classPerformance(classId: string) {
    const attempts = await db.studentTestAttempt.findMany({
      where: { test: { classId }, status: "SUBMITTED" },
      include: { student: true, test: true },
      orderBy: { submittedAt: "desc" },
    });
    const byStudent = new Map<
      string,
      { name: string; identifier: string; scores: number[]; latest: number }
    >();
    for (const row of attempts) {
      const current = byStudent.get(row.studentId) ?? {
        name: `${row.student.firstName} ${row.student.lastName}`.trim(),
        identifier: row.student.studentIdentifier,
        scores: [],
        latest: row.percentage,
      };
      current.scores.push(row.percentage);
      byStudent.set(row.studentId, current);
    }
    return {
      results: attempts,
      students: [...byStudent.entries()].map(([id, value]) => ({
        id,
        name: value.name,
        studentIdentifier: value.identifier,
        averageScore: average(value.scores),
        highestScore: Math.max(...value.scores),
        latestScore: value.latest,
        attempts: value.scores.length,
      })),
    };
  },

  async student(studentId: string) {
    const attempts = await db.studentTestAttempt.findMany({
      where: { studentId, status: "SUBMITTED" },
      include: { test: { include: { class: true } } },
      orderBy: { submittedAt: "desc" },
    });
    const scores = attempts.map((row) => row.percentage);
    return {
      attempted: attempts.length,
      averageScore: average(scores),
      highestScore: scores.length ? Math.max(...scores) : 0,
      lowestScore: scores.length ? Math.min(...scores) : 0,
      latestScore: scores[0] ?? 0,
      history: attempts,
    };
  },
};
