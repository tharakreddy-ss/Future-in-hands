import { randomInt } from "crypto";
import { studentRepository } from "@/repositories/student.repository";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { clearAccountFailures, loginThrottleKeys } from "@/lib/login-throttle";
import { fullName, httpError, splitName } from "@/lib/utils";
import { removePrivateObject } from "@/lib/private-storage";
import { testService } from "@/services/test.service";

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const formatIdentifier = (prefix: string, n: number) => `${prefix}${String(n).padStart(3, "0")}`;

/**
 * Next `${prefix}NNN` after the institution's highest issued number. Legacy IDs such as
 * STU006-AB12CD34 count as 6; their random suffix is never read as part of the number.
 * studentIdentifier is unique across all institutions, so numbers taken elsewhere are skipped.
 */
async function nextStudentIdentifier(institutionId: string, prefix: string) {
  const pattern = new RegExp(`^${escapeRegExp(prefix)}(\\d+)(?:-[A-Z0-9]+)?$`);
  const rows = await db.student.findMany({
    where: { studentIdentifier: { startsWith: prefix } },
    select: { institutionId: true, studentIdentifier: true },
  });
  let n = 1;
  for (const row of rows) {
    const match = row.institutionId === institutionId ? pattern.exec(row.studentIdentifier) : null;
    if (match) n = Math.max(n, Number(match[1]) + 1);
  }
  const taken = new Set(rows.map((row) => row.studentIdentifier));
  while (taken.has(formatIdentifier(prefix, n))) n += 1;
  return formatIdentifier(prefix, n);
}

function isStudentIdentifierConflict(error: unknown) {
  if (!error || typeof error !== "object" || (error as { code?: string }).code !== "P2002") return false;
  const target = JSON.stringify((error as { meta?: { target?: unknown } }).meta?.target ?? "");
  return target.includes("student_identifier") || target.includes("studentIdentifier");
}

const TEMP_PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

function temporaryPassword(length = 12) {
  return Array.from({ length }, () => TEMP_PASSWORD_ALPHABET[randomInt(TEMP_PASSWORD_ALPHABET.length)]).join("");
}

export function presentStudent(student: {
  id: string;
  firstName: string;
  lastName: string;
  studentIdentifier: string;
  status: "ACTIVE" | "INACTIVE";
  photoKey: string | null;
  rollNumber: string | null;
  enrollments: Array<{
    classId: string;
    class: { name: string; section: string | null; academicYear?: string };
  }>;
}) {
  const classes = student.enrollments.map((row) => ({
    id: row.classId,
    name: row.class.name,
    section: row.class.section ?? "",
    academicYear: row.class.academicYear ?? "",
  }));
  const primary = classes[0];
  return {
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    name: fullName(student.firstName, student.lastName),
    studentIdentifier: student.studentIdentifier,
    status: student.status,
    rollNumber: student.rollNumber,
    photoUrl: student.photoKey ? `/api/students/${student.id}/photo` : null,
    classId: primary?.id ?? null,
    className: primary?.name ?? "Unassigned",
    section: primary?.section || "—",
    academicYear: primary?.academicYear || null,
    classes,
  };
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
  directory(institutionId: string) {
    return studentRepository.directory(institutionId);
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
    const email = data.email?.toLowerCase();
    await db.$transaction(async (tx) => {
      const student = await tx.student.update({ where: { id }, data: { ...data, ...(email ? { email } : {}) } });
      if (data.firstName !== undefined || data.lastName !== undefined || email) {
        await tx.user.update({
          where: { id: student.userId },
          data: { name: fullName(student.firstName, student.lastName), ...(email ? { email } : {}) },
        });
      }
    });
    return studentRepository.get(id);
  },
  /** Replaces the password with a one-time temporary one and signs the student out everywhere. */
  async resetPassword(studentId: string, institutionId: string) {
    const student = await db.student.findFirst({
      where: { id: studentId, institutionId },
      select: { userId: true, studentIdentifier: true },
    });
    if (!student) throw httpError("Student not found", 404);
    const password = temporaryPassword();
    await db.user.update({
      where: { id: student.userId },
      data: { passwordHash: await hashPassword(password), sessionVersion: { increment: 1 } },
    });
    await clearAccountFailures(loginThrottleKeys(`student:${student.studentIdentifier}`, null));
    return { studentIdentifier: student.studentIdentifier, temporaryPassword: password };
  },
  async create(input: {
    name?: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
    password: string;
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
    if (!input.password) throw httpError("An initial password is required.", 400);
    const institution = await db.institution.findUnique({ where: { id: input.institutionId } });
    const prefix = institution?.studentIdPrefix ?? "STU";
    const passwordHash = await hashPassword(input.password);
    for (let attempt = 1; ; attempt++) {
      const studentIdentifier = await nextStudentIdentifier(input.institutionId, prefix);
      try {
        const created = await db.$transaction(async (tx) => {
          const user = await tx.user.create({ data: { name: fullName(names.firstName, names.lastName), email: input.email.toLowerCase(), passwordHash, role: "STUDENT", institutionId: input.institutionId } });
          const student = await tx.student.create({ data: {
            userId: user.id, institutionId: input.institutionId, studentIdentifier,
            firstName: names.firstName, lastName: names.lastName, email: input.email.toLowerCase(), phone: input.phone,
            photoKey: input.photoKey, dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
            gender: input.gender, guardianName: input.guardianName, guardianPhone: input.guardianPhone,
            address: input.address, academicYear: input.academicYear, rollNumber: input.rollNumber,
          } });
          if (input.classId) await tx.classStudent.create({ data: { classId: input.classId, studentId: student.id } });
          return student;
        });
        return studentRepository.get(created.id);
      } catch (error) {
        // Two concurrent creates can pick the same number; recompute and retry.
        if (attempt >= 3 || !isStudentIdentifierConflict(error)) throw error;
      }
    }
  },
  enroll(classId: string, studentId: string) {
    return studentRepository.enroll(classId, studentId);
  },
  portalContext(studentId: string) {
    return db.student.findUnique({
      where: { id: studentId },
      select: {
        firstName: true,
        lastName: true,
        studentIdentifier: true,
        academicYear: true,
        photoKey: true,
        enrollments: {
          orderBy: [{ joinedAt: "desc" }, { id: "asc" }],
          take: 1,
          select: { class: { select: { name: true, academicYear: true } } },
        },
      },
    });
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
      section: enrollment?.class.section || "—",
      academicYear: enrollment?.class.academicYear ?? student.academicYear,
      rollNumber: student.rollNumber,
      dateOfBirth: student.dateOfBirth?.toISOString() ?? null,
      gender: student.gender,
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      address: student.address,
      classSubjects: enrollment?.class.subjects.map((item) => item.subject.name) ?? [],
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
