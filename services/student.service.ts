import { studentRepository } from "@/repositories/student.repository";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { fullName, httpError, splitName } from "@/lib/utils";
import { removePrivateObject } from "@/lib/private-storage";
import { testService } from "@/services/test.service";

async function nextStudentIdentifier(institutionId: string, prefix: string) {
  const last = await db.student.findFirst({
    where: { institutionId, studentIdentifier: { startsWith: prefix } },
    orderBy: { studentIdentifier: "desc" },
  });
  const n = last ? Number(last.studentIdentifier.replace(/\D/g, "")) + 1 : 1;
  return `${prefix}${String(Number.isFinite(n) ? n : 1).padStart(3, "0")}`;
}

function mean(values: number[]) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Last 5 submitted scores vs the previous 5. Numeric delta only when both groups have 5 exams. */
export function examImprovement(scores: number[]) {
  const lastFive = scores.slice(-5);
  const prior = scores.slice(-10, -5);
  const comparable = lastFive.length === 5 && prior.length === 5;
  return {
    comparable,
    delta: comparable ? Math.round(mean(lastFive) - mean(prior)) : 0,
    lastAvg: lastFive.length ? mean(lastFive) : 0,
  };
}

export const studentService = {
  list(institutionId: string) {
    return studentRepository.list(institutionId);
  },
  search(institutionId: string, q: string) {
    return studentRepository.search(institutionId, q);
  },
  get(id: string) {
    return studentRepository.get(id);
  },
  async update(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string | null;
      status?: "ACTIVE" | "INACTIVE";
    },
  ) {
    const student = await studentRepository.update(id, data);
    if (data.firstName || data.lastName || data.email) {
      const fresh = await studentRepository.get(id);
      if (fresh) {
        await db.user.update({
          where: { id: fresh.userId },
          data: {
            name: fullName(fresh.firstName, fresh.lastName),
            ...(data.email ? { email: data.email.toLowerCase() } : {}),
          },
        });
      }
    }
    return studentRepository.get(student.id);
  },
  async create(input: {
    name?: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
    password?: string;
    institutionId: string;
    classId?: string;
    photoKey?: string;
    dateOfBirth?: string;
    gender?: string;
    guardianName?: string;
    guardianPhone?: string;
    address?: string;
    academicYear?: string;
    rollNumber?: string;
  }) {
    if (input.classId && !(await db.class.findFirst({ where: { id: input.classId, institutionId: input.institutionId } }))) throw Object.assign(new Error("Class not found"), { status: 404 });
    const names = input.firstName
      ? { firstName: input.firstName, lastName: input.lastName ?? "" }
      : splitName(input.name ?? "Student");
    const institution = await db.institution.findUnique({ where: { id: input.institutionId } });
    const identifier = await nextStudentIdentifier(input.institutionId, institution?.studentIdPrefix ?? "STU");
    const passwordHash = await hashPassword(input.password || "Student@123");
    const created = await db.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { name: fullName(names.firstName, names.lastName), email: input.email.toLowerCase(), passwordHash, role: "STUDENT", institutionId: input.institutionId } });
      const student = await tx.student.create({ data: {
        userId: user.id, institutionId: input.institutionId,
        studentIdentifier: `${identifier}-${user.id.slice(-8).toUpperCase()}`,
        firstName: names.firstName, lastName: names.lastName, email: input.email.toLowerCase(), phone: input.phone,
        photoKey: input.photoKey, dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
        gender: input.gender, guardianName: input.guardianName, guardianPhone: input.guardianPhone,
        address: input.address, academicYear: input.academicYear, rollNumber: input.rollNumber,
      } });
      if (input.classId) await tx.classStudent.create({ data: { classId: input.classId, studentId: student.id } });
      return student;
    });
    return studentRepository.get(created.id);
  },
  enroll(classId: string, studentId: string) {
    return studentRepository.enroll(classId, studentId);
  },
  enrollmentCount(studentId: string) {
    return db.classStudent.count({ where: { studentId } });
  },
  classSummariesForStudent(studentId: string, take = 4) {
    return db.classStudent.findMany({
      where: { studentId },
      orderBy: { joinedAt: "desc" },
      take,
      select: {
        id: true,
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
            academicYear: true,
            section: true,
            groupName: true,
          },
        },
      },
    });
  },
  async classesForStudent(studentId: string) {
    return db.classStudent.findMany({
      where: { studentId },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
            description: true,
            academicYear: true,
            section: true,
            groupName: true,
            program: true,
            createdBy: { select: { name: true } },
            _count: { select: { syllabuses: true, subjects: true } },
          },
        },
      },
    });
  },
  /** Returns the enrollment only when this student is in the class; otherwise null. */
  async classForEnrolledStudent(studentId: string, classId: string) {
    return db.classStudent.findUnique({
      where: { classId_studentId: { classId, studentId } },
      include: {
        class: {
          include: {
            createdBy: { select: { id: true, name: true } },
          },
        },
      },
    });
  },
  /** Enrolled classroom only: class metadata, syllabus/topics, linked subjects, and this student's assignments. */
  async classroomForStudent(studentId: string, classId: string) {
    const enrollment = await db.classStudent.findUnique({
      where: { classId_studentId: { classId, studentId } },
      include: {
        class: {
          include: {
            createdBy: { select: { id: true, name: true } },
            syllabuses: {
              select: {
                id: true,
                title: true,
                inputType: true,
                createdAt: true,
                topics: { select: { id: true, name: true, parentTopicId: true, weightage: true } },
              },
              orderBy: { createdAt: "desc" },
            },
            subjects: {
              include: {
                subject: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    syllabusFileName: true,
                    materialFileName: true,
                    createdAt: true,
                    units: {
                      orderBy: { order: "asc" },
                      select: {
                        id: true,
                        name: true,
                        topics: { orderBy: { order: "asc" }, select: { name: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!enrollment) return null;
    const assignments = await testService.forStudentInClass(studentId, classId);
    const testIds = assignments.map((row) => row.testId);
    const attempts = testIds.length
      ? await db.studentTestAttempt.findMany({
          where: { studentId, testId: { in: testIds } },
          select: { id: true, testId: true, status: true },
        })
      : [];
    return { class: enrollment.class, assignments, attempts };
  },
  async stats(studentId: string) {
    const submitted = await db.studentTestAttempt.findMany({
      where: { studentId, status: "SUBMITTED" },
    });
    const scores = submitted.map((row) => row.percentage);
    const latest = submitted.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())[0];
    return {
      attempted: submitted.length,
      average: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      highest: scores.length ? Math.max(...scores) : 0,
      lowest: scores.length ? Math.min(...scores) : 0,
      latest: latest?.percentage ?? 0,
    };
  },
  async profile(studentId: string) {
    const student = await studentRepository.get(studentId);
    if (!student) return null;
    const attempts = await db.studentTestAttempt.findMany({
      where: { studentId, status: "SUBMITTED" },
      include: { test: { include: { class: true } } },
      orderBy: { submittedAt: "asc" },
    });
    const scores = attempts.map((row) => row.percentage);
    const enrollment = student.enrollments[0];
    const classId = enrollment?.classId;
    let rank: { position: number; of: number } | null = null;
    if (classId) {
      const classmates = await db.classStudent.findMany({
        where: { classId },
        select: { studentId: true },
      });
      const averages = await Promise.all(
        classmates.map(async (row) => {
          const rows = await db.studentTestAttempt.findMany({
            where: { studentId: row.studentId, status: "SUBMITTED" },
            select: { percentage: true },
          });
          const vals = rows.map((item) => item.percentage);
          return {
            studentId: row.studentId,
            avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : -1,
          };
        }),
      );
      const ranked = averages.filter((row) => row.avg >= 0).sort((a, b) => b.avg - a.avg);
      const position = ranked.findIndex((row) => row.studentId === studentId) + 1;
      rank = { position: position || ranked.length, of: classmates.length };
    }
    const bySubject = new Map<string, number[]>();
    for (const row of attempts) {
      const subject = row.test.class.subject || row.test.class.name;
      const list = bySubject.get(subject) ?? [];
      list.push(row.percentage);
      bySubject.set(subject, list);
    }
    const subjects = [...bySubject.entries()].map(([name, vals]) => {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      const status =
        avg >= 85 ? "Excellent" : avg >= 75 ? "Good" : avg >= 60 ? "Average" : "Needs Improvement";
      return { name, average: avg, status, attempts: vals.length };
    });
    const { comparable, delta, lastAvg } = examImprovement(scores);
    const strengths = subjects.filter((s) => s.average >= 75).map((s) => s.name);
    const weak = subjects.filter((s) => s.average < 75).map((s) => s.name);
    const name = fullName(student.firstName, student.lastName);
    const overallAvg = scores.length ? Math.round(mean(scores)) : 0;
    let subjectTakeaway = "";
    if (subjects.length) {
      const strongest = [...subjects].sort((a, b) => b.average - a.average)[0];
      const weakest = [...subjects].sort((a, b) => a.average - b.average)[0];
      if (strengths.length && weak.length) {
        subjectTakeaway = ` Strongest subject so far is ${strongest.name} at ${Math.round(strongest.average)}%. Weakest is ${weakest.name} at ${Math.round(weakest.average)}% (below 75%).`;
      } else if (strengths.length) {
        subjectTakeaway = ` Every subject averages 75% or higher. Strongest is ${strongest.name} at ${Math.round(strongest.average)}%.`;
      } else {
        subjectTakeaway = ` No subject has reached a 75% average yet. Lowest is ${weakest.name} at ${Math.round(weakest.average)}%.`;
      }
    }
    let summary: string;
    if (attempts.length === 0) {
      summary = `${name} has not submitted any tests yet.`;
    } else if (!comparable) {
      summary = `${name} has ${attempts.length} submitted ${attempts.length === 1 ? "exam" : "exams"} with an average of ${overallAvg}%. Improvement is shown after 10 submitted exams (last 5 vs previous 5).${subjectTakeaway}`;
    } else if (delta === 0) {
      summary = `${name}'s last 5 exams average ${Math.round(lastAvg)}%, matching the previous 5 (no change).${subjectTakeaway}`;
    } else if (delta > 0) {
      summary = `${name}'s last 5 exams average ${Math.round(lastAvg)}%, ${Math.abs(delta)} points higher than the previous 5.${subjectTakeaway}`;
    } else {
      summary = `${name}'s last 5 exams average ${Math.round(lastAvg)}%, ${Math.abs(delta)} points lower than the previous 5.${subjectTakeaway}`;
    }
    const history = attempts
      .slice()
      .reverse()
      .map((row) => ({
        id: row.id,
        examName: row.test.title,
        subject: row.test.class.subject,
        date: (row.submittedAt ?? row.startedAt).toISOString(),
        score: row.score,
        total: row.totalQuestions,
        percentage: row.percentage,
        status: row.status,
      }));
    return {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      name: fullName(student.firstName, student.lastName),
      studentIdentifier: student.studentIdentifier,
      email: student.email,
      phone: student.phone,
      photoUrl: student.photoKey ? `/api/students/${student.id}/photo` : null,
      status: student.status,
      joinDate: student.createdAt.toISOString(),
      institution: student.institution.name,
      className: enrollment?.class.name ?? "Unassigned",
      section: enrollment?.class.subject ?? "—",
      classId: classId ?? null,
      metrics: {
        attempted: attempts.length,
        averageScore: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
        highestScore: scores.length ? Math.max(...scores) : 0,
        lowestScore: scores.length ? Math.min(...scores) : 0,
        rank,
      },
      series: attempts.map((row) => ({
        examName: row.test.title,
        subject: row.test.class.subject,
        date: (row.submittedAt ?? row.startedAt).toISOString(),
        score: row.score,
        total: row.totalQuestions,
        percentage: row.percentage,
      })),
      subjects,
      history,
      insights: {
        summary,
        strengths,
        weak,
      },
    };
  },
  async updateOwnProfile(
    studentId: string,
    data: {
      firstName: string;
      lastName: string;
      phone: string | null;
      gender: string | null;
      dateOfBirth: Date | null;
      address: string | null;
      guardianName: string | null;
      guardianPhone: string | null;
    },
  ) {
    const student = await db.student.findUnique({ where: { id: studentId } });
    if (!student) throw httpError("Student not found", 404);
    await db.student.update({
      where: { id: studentId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        address: data.address,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
      },
    });
    await db.user.update({
      where: { id: student.userId },
      data: { name: fullName(data.firstName, data.lastName) },
    });
    return studentRepository.get(studentId);
  },
  async changeOwnPassword(studentId: string, currentPassword: string, nextPassword: string) {
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: { user: { select: { id: true, passwordHash: true } } },
    });
    if (!student) throw httpError("Student not found", 404);
    if (!(await verifyPassword(currentPassword, student.user.passwordHash))) {
      throw httpError("Current password is incorrect", 400);
    }
    await db.user.update({
      where: { id: student.user.id },
      data: { passwordHash: await hashPassword(nextPassword) },
    });
  },
  async setOwnPhoto(studentId: string, photoKey: string) {
    const student = await db.student.findUnique({ where: { id: studentId }, select: { photoKey: true } });
    if (!student) throw httpError("Student not found", 404);
    await db.student.update({ where: { id: studentId }, data: { photoKey } });
    if (student.photoKey && student.photoKey !== photoKey) {
      await removePrivateObject("student-photos", student.photoKey);
    }
  },
};
