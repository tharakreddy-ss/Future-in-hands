import { withAuth } from "@/lib/with-auth";
import { json } from "@/lib/utils";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  return withAuth(async (session) => {
  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query || query.length < 2) return json({ results: [] });

  const contains = { contains: query, mode: "insensitive" as const };
  const results: { id: string; title: string; detail: string; href: string; kind: string }[] = [];

  if (session.role === "STUDENT") {
    if (!session.studentId) return json({ results });
    const assigned = await db.testAssignment.findMany({
      where: { studentId: session.studentId, test: { title: contains } },
      include: { test: { include: { class: true } } },
      take: 6,
      orderBy: { assignedAt: "desc" },
    });
    for (const row of assigned) results.push({
      id: row.testId,
      title: row.test.title,
      detail: `${row.test.class.name} · Exam`,
      href: `/student/tests/${row.testId}`,
      kind: "Exam",
    });
    return json({ results });
  }

  if (session.role === "SUPER_ADMIN") {
    const [tests, institutions] = await Promise.all([
      db.test.findMany({ where: { title: contains }, include: { institution: true, class: true }, take: 4, orderBy: { updatedAt: "desc" } }),
      db.institution.findMany({ where: { name: contains }, take: 4, orderBy: { name: "asc" } }),
    ]);
    for (const test of tests) results.push({ id: test.id, title: test.title, detail: `${test.institution.name} · ${test.class.name}`, href: `/super-admin/exams/${test.id}`, kind: "Exam" });
    for (const institution of institutions) results.push({ id: institution.id, title: institution.name, detail: `${institution.subscriptionPlan} plan · Institution`, href: "/super-admin/institutions", kind: "Institution" });
    return json({ results: results.slice(0, 8) });
  }

  const institutionId = session.institutionId;
  if (!institutionId) return json({ results });

  const [classes, tests, students] = await Promise.all([
    db.class.findMany({ where: { institutionId, name: contains }, select: { id: true, name: true, subject: true }, take: 3, orderBy: { name: "asc" } }),
    db.test.findMany({ where: { institutionId, title: contains }, include: { class: true }, take: 4, orderBy: { updatedAt: "desc" } }),
    db.student.findMany({
      where: {
        institutionId,
        OR: [
          { firstName: contains },
          { lastName: contains },
          { studentIdentifier: contains },
          { email: contains },
        ],
      },
      take: 4,
      orderBy: { firstName: "asc" },
    }),
  ]);
  const basePath = session.role === "TEACHER" ? "/teacher" : "/admin";
  for (const cls of classes) results.push({ id: cls.id, title: cls.name, detail: `${cls.subject} · Class`, href: session.role === "TEACHER" ? "/teacher/classes" : `${basePath}/classes/${cls.id}/overview`, kind: "Class" });
  for (const test of tests) results.push({ id: test.id, title: test.title, detail: `${test.class.name} · Exam`, href: `${basePath}/exams/${test.id}`, kind: "Exam" });
  for (const student of students) results.push({ id: student.id, title: `${student.firstName} ${student.lastName}`, detail: `${student.studentIdentifier} · Student`, href: `${basePath}/students/${student.id}`, kind: "Student" });

  return json({ results: results.slice(0, 8) });
  }, ["SUPER_ADMIN", "INSTITUTION_ADMIN", "TEACHER", "STUDENT"]);
}
