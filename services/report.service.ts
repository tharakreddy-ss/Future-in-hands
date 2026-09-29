import { db } from "@/lib/db";
import { examImprovement, studentService } from "@/services/student.service";
import { fullName } from "@/lib/utils";

export const NOT_SPECIFIED = "Not specified";

function average(values: number[]) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

/** Same thresholds as the Student Profile subject status. */
export function performanceStatus(avg: number) {
  return avg >= 85 ? "Excellent" : avg >= 75 ? "Good" : avg >= 60 ? "Average" : "Needs Improvement";
}

/** Improvement language only appears when 10+ scores exist (last 5 vs previous 5). */
function improvementSentence(scores: number[], subject: string) {
  const { comparable, delta, lastAvg } = examImprovement(scores);
  if (!comparable) return null;
  if (delta === 0) return `${subject} last 5 exams average ${Math.round(lastAvg)}%, matching the previous 5.`;
  return `${subject} last 5 exams average ${Math.round(lastAvg)}%, ${Math.abs(delta)} points ${delta > 0 ? "higher" : "lower"} than the previous 5.`;
}

export type ClassReportPickerRow = {
  id: string;
  name: string;
  section: string | null;
  academicYear: string;
  groupName: string;
  subjects: string[];
  studentCount: number;
  examCount: number;
};

export type ClassReport = NonNullable<Awaited<ReturnType<typeof reportService.classReport>>>;

export type StudentReportPickerRow = {
  id: string;
  name: string;
  studentIdentifier: string;
  rollNumber: string | null;
  status: "ACTIVE" | "INACTIVE";
  classes: Array<{ id: string; label: string }>;
};

export type StudentReport = NonNullable<Awaited<ReturnType<typeof reportService.studentReport>>>;

export const reportService = {
  async studentPicker(institutionId: string): Promise<StudentReportPickerRow[]> {
    const rows = await db.student.findMany({
      where: { institutionId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentIdentifier: true,
        rollNumber: true,
        status: true,
        enrollments: {
          select: { class: { select: { id: true, name: true, section: true } } },
        },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });
    return rows.map((row) => ({
      id: row.id,
      name: fullName(row.firstName, row.lastName),
      studentIdentifier: row.studentIdentifier,
      rollNumber: row.rollNumber,
      status: row.status,
      classes: row.enrollments.map(({ class: cls }) => ({
        id: cls.id,
        label: cls.section ? `${cls.name} · ${cls.section}` : cls.name,
      })),
    }));
  },

  /** Returns null when the student does not exist or belongs to another institution. */
  async studentReport(studentId: string, institutionId: string) {
    const owned = await db.student.findFirst({
      where: { id: studentId, institutionId },
      select: { id: true },
    });
    if (!owned) return null;

    const [profile, attempts] = await Promise.all([
      studentService.profile(studentId),
      db.studentTestAttempt.findMany({
        where: { studentId, status: "SUBMITTED", test: { institutionId } },
        select: {
          id: true,
          correctAnswers: true,
          wrongAnswers: true,
          unansweredQuestions: true,
          timeTakenSeconds: true,
          test: { select: { subject: { select: { name: true } } } },
        },
      }),
    ]);
    if (!profile) return null;

    const detailById = new Map(attempts.map((row) => [row.id, row]));
    const blank = (value: string | null | undefined) => {
      const trimmed = value?.trim();
      return trimmed && trimmed !== "—" ? trimmed : null;
    };

    return {
      generatedAt: new Date().toISOString(),
      institution: profile.institution,
      student: {
        id: profile.id,
        name: profile.name,
        studentIdentifier: profile.studentIdentifier,
        photoUrl: profile.photoUrl,
        status: profile.status,
        email: profile.email,
        phone: blank(profile.phone),
        rollNumber: blank(profile.rollNumber),
        className: profile.classId ? profile.className : null,
        section: blank(profile.section),
        academicYear: blank(profile.academicYear),
        gender: blank(profile.gender),
        dateOfBirth: profile.dateOfBirth,
        guardianName: blank(profile.guardianName),
        guardianPhone: blank(profile.guardianPhone),
        joinDate: profile.joinDate,
        classSubjects: profile.classSubjects,
      },
      metrics: profile.metrics,
      series: profile.series,
      subjects: profile.subjects,
      insights: {
        ...profile.insights,
        summary:
          profile.metrics.attempted === 0
            ? `${profile.name} has not submitted any exams yet.`
            : [
                `${profile.name} has ${profile.metrics.attempted} submitted ${profile.metrics.attempted === 1 ? "exam" : "exams"} with an average of ${Math.round(profile.metrics.averageScore)}%.`,
                improvementSentence(
                  profile.series.map((row) => row.percentage),
                  "The",
                ),
              ]
                .filter(Boolean)
                .join(" "),
      },
      history: profile.history.map((row) => {
        const detail = detailById.get(row.id);
        return {
          id: row.id,
          examName: row.examName,
          subject: blank(detail?.test.subject?.name) ?? blank(row.subject),
          date: row.date,
          score: row.score,
          total: row.total,
          percentage: row.percentage,
          correct: detail?.correctAnswers ?? null,
          wrong: detail?.wrongAnswers ?? null,
          unanswered: detail?.unansweredQuestions ?? null,
          timeTakenSeconds: detail && detail.timeTakenSeconds > 0 ? detail.timeTakenSeconds : null,
          status: row.status,
        };
      }),
    };
  },

  async classPicker(institutionId: string): Promise<ClassReportPickerRow[]> {
    const rows = await db.class.findMany({
      where: { institutionId },
      select: {
        id: true,
        name: true,
        section: true,
        academicYear: true,
        groupName: true,
        subjects: { select: { subject: { select: { name: true } } } },
        _count: { select: { enrollments: true, tests: { where: { status: { not: "DRAFT" }, examStatus: { not: "DRAFT" } } } } },
      },
      orderBy: [{ academicYear: "asc" }, { name: "asc" }],
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      section: row.section?.trim() || null,
      academicYear: row.academicYear,
      groupName: row.groupName,
      subjects: row.subjects.map((item) => item.subject.name).sort(),
      studentCount: row._count.enrollments,
      examCount: row._count.tests,
    }));
  },

  /** Returns null when the class does not exist or belongs to another institution. */
  async classReport(classId: string, institutionId: string) {
    const cls = await db.class.findFirst({
      where: { id: classId, institutionId },
      select: {
        id: true,
        name: true,
        section: true,
        academicYear: true,
        groupName: true,
        program: true,
        institution: { select: { name: true } },
        subjects: { select: { subject: { select: { name: true } } } },
        enrollments: {
          where: { student: { institutionId } },
          select: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                studentIdentifier: true,
                rollNumber: true,
                status: true,
              },
            },
          },
        },
      },
    });
    if (!cls) return null;

    const [tests, attempts] = await Promise.all([
      db.test.findMany({
        where: { classId, institutionId, status: { not: "DRAFT" }, examStatus: { not: "DRAFT" } },
        select: {
          id: true,
          title: true,
          examStatus: true,
          examDate: true,
          startAt: true,
          subject: { select: { name: true } },
          _count: { select: { assignments: true } },
        },
      }),
      db.studentTestAttempt.findMany({
        where: {
          status: "SUBMITTED",
          test: { classId, institutionId, status: { not: "DRAFT" }, examStatus: { not: "DRAFT" } },
        },
        select: { studentId: true, testId: true, percentage: true, submittedAt: true, startedAt: true },
      }),
    ]);

    const attemptsByTest = new Map<string, typeof attempts>();
    const attemptsByStudent = new Map<string, typeof attempts>();
    for (const row of attempts) {
      attemptsByTest.set(row.testId, [...(attemptsByTest.get(row.testId) ?? []), row]);
      attemptsByStudent.set(row.studentId, [...(attemptsByStudent.get(row.studentId) ?? []), row]);
    }
    const submittedAt = (row: (typeof attempts)[number]) => (row.submittedAt ?? row.startedAt).getTime();

    const exams = tests
      .map((test) => {
        const rows = attemptsByTest.get(test.id) ?? [];
        const scores = rows.map((row) => row.percentage);
        const opened = test.examStatus === "LIVE" || test.examStatus === "CLOSED" || rows.length > 0;
        const scheduled = test.examDate ?? test.startAt;
        const firstSubmission = rows.length ? new Date(Math.min(...rows.map(submittedAt))) : null;
        return {
          id: test.id,
          name: test.title,
          subject: test.subject?.name?.trim() || NOT_SPECIFIED,
          date: (scheduled ?? firstSubmission)?.toISOString() ?? null,
          examStatus: test.examStatus,
          opened,
          assigned: test._count.assignments,
          submitted: rows.length,
          average: average(scores),
          highest: scores.length ? Math.max(...scores) : null,
          lowest: scores.length ? Math.min(...scores) : null,
          completionRate: opened && test._count.assignments > 0 ? (rows.length / test._count.assignments) * 100 : null,
        };
      })
      .sort((a, b) => {
        if (a.date && b.date) return new Date(b.date).getTime() - new Date(a.date).getTime();
        return a.date ? -1 : b.date ? 1 : a.name.localeCompare(b.name);
      });

    const students = cls.enrollments
      .map(({ student }) => {
        const rows = (attemptsByStudent.get(student.id) ?? []).slice().sort((a, b) => submittedAt(a) - submittedAt(b));
        const scores = rows.map((row) => row.percentage);
        const avg = average(scores);
        return {
          id: student.id,
          name: fullName(student.firstName, student.lastName),
          studentIdentifier: student.studentIdentifier,
          rollNumber: student.rollNumber?.trim() || null,
          status: student.status,
          attempted: rows.length,
          average: avg,
          highest: scores.length ? Math.max(...scores) : null,
          latest: scores.length ? scores[scores.length - 1] : null,
          performance: avg === null ? null : performanceStatus(avg),
        };
      })
      .sort((a, b) => {
        if (a.average !== null && b.average !== null) return b.average - a.average || a.name.localeCompare(b.name);
        return a.average !== null ? -1 : b.average !== null ? 1 : a.name.localeCompare(b.name);
      });

    const bySubject = new Map<string, { exams: number; scores: number[] }>();
    for (const exam of exams) {
      const entry = bySubject.get(exam.subject) ?? { exams: 0, scores: [] };
      entry.exams += 1;
      entry.scores.push(...(attemptsByTest.get(exam.id) ?? []).map((row) => row.percentage));
      bySubject.set(exam.subject, entry);
    }
    const subjects = [...bySubject.entries()]
      .map(([name, entry]) => {
        const avg = average(entry.scores);
        return {
          name,
          exams: entry.exams,
          submissions: entry.scores.length,
          average: avg,
          status: avg === null ? null : performanceStatus(avg),
        };
      })
      .sort((a, b) => (a.name === NOT_SPECIFIED ? 1 : b.name === NOT_SPECIFIED ? -1 : a.name.localeCompare(b.name)));

    const firstSubmission = (examId: string) =>
      Math.min(...(attemptsByTest.get(examId) ?? []).map(submittedAt));
    const trend = exams
      .filter((exam) => exam.average !== null && exam.date)
      .sort(
        (a, b) =>
          new Date(a.date!).getTime() - new Date(b.date!).getTime() || firstSubmission(a.id) - firstSubmission(b.id),
      )
      .map((exam) => ({ examName: exam.name, date: exam.date!, percentage: exam.average! }));

    const allScores = attempts.map((row) => row.percentage);
    const openedExams = exams.filter((exam) => exam.opened);
    const assignedOpened = openedExams.reduce((sum, exam) => sum + exam.assigned, 0);
    const submittedOpened = openedExams.reduce((sum, exam) => sum + exam.submitted, 0);

    const overview = {
      totalStudents: students.length,
      activeStudents: students.filter((row) => row.status === "ACTIVE").length,
      examsPublished: exams.length,
      examsOpened: openedExams.length,
      examsScheduled: exams.filter((exam) => !exam.opened).length,
      submissions: attempts.length,
      averageScore: average(allScores),
      completionRate: assignedOpened > 0 ? (submittedOpened / assignedOpened) * 100 : null,
      highestScore: allScores.length ? Math.max(...allScores) : null,
      lowestScore: allScores.length ? Math.min(...allScores) : null,
    };

    const insights: string[] = [];
    if (overview.submissions > 0) {
      const withResults = exams.filter((exam) => exam.submitted > 0).length;
      insights.push(
        `${overview.submissions} ${overview.submissions === 1 ? "submission" : "submissions"} across ${withResults} ${withResults === 1 ? "exam" : "exams"}, with an average score of ${Math.round(overview.averageScore ?? 0)}%.`,
      );
      const notAttempted = students.filter((row) => row.attempted === 0);
      if (notAttempted.length && openedExams.length) {
        insights.push(
          `${notAttempted.length} of ${students.length} enrolled ${students.length === 1 ? "student has" : "students have"} not submitted any exam yet.`,
        );
      }
      if (overview.completionRate !== null && overview.completionRate < 75) {
        insights.push(
          `Completion rate is ${Math.round(overview.completionRate)}% (${submittedOpened} of ${assignedOpened} assigned papers submitted). Follow up on pending submissions.`,
        );
      }
      const top = students.filter((row) => row.average !== null && row.average >= 85);
      if (top.length) {
        insights.push(`Excellent performers (average 85% or higher): ${top.slice(0, 5).map((row) => row.name).join(", ")}${top.length > 5 ? ` and ${top.length - 5} more` : ""}.`);
      }
      const support = students.filter((row) => row.average !== null && row.average < 60);
      if (support.length) {
        insights.push(`Needs support (average below 60%): ${support.slice(0, 5).map((row) => row.name).join(", ")}${support.length > 5 ? ` and ${support.length - 5} more` : ""}.`);
      }
      const namedSubjects = subjects.filter((row) => row.name !== NOT_SPECIFIED && row.average !== null);
      if (namedSubjects.length >= 2) {
        const sorted = [...namedSubjects].sort((a, b) => b.average! - a.average!);
        const best = sorted[0];
        const worst = sorted[sorted.length - 1];
        insights.push(
          `Strongest subject is ${best.name} (${Math.round(best.average!)}%); weakest is ${worst.name} (${Math.round(worst.average!)}%).`,
        );
      }
      const scoredExams = exams.filter((exam) => exam.average !== null);
      if (scoredExams.length >= 2) {
        const hardest = [...scoredExams].sort((a, b) => a.average! - b.average!)[0];
        insights.push(`Lowest-scoring exam: ${hardest.name} (class average ${Math.round(hardest.average!)}%).`);
      }
      const trendSentence = improvementSentence(
        trend.map((row) => row.percentage),
        "The class's",
      );
      if (trendSentence) insights.push(trendSentence);
    }

    return {
      generatedAt: new Date().toISOString(),
      institution: cls.institution.name,
      class: {
        id: cls.id,
        name: cls.name,
        section: cls.section?.trim() || null,
        academicYear: cls.academicYear,
        groupName: cls.groupName,
        program: cls.program?.trim() || null,
        subjects: cls.subjects.map((item) => item.subject.name).sort(),
      },
      overview,
      students,
      subjects,
      exams,
      trend,
      insights,
    };
  },
};
