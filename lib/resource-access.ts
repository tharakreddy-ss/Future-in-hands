import { db } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import type { SessionUser } from "@/types";

export async function requireClassAccess(user: SessionUser, id: string) {
  const tenant = requireTenant(user);
  const row = await db.class.findFirst({ where: { id, ...(tenant ? { institutionId: tenant } : {}) } });
  if (!row) throw Object.assign(new Error("Class not found"), { status: 404 });
  return row;
}
export async function requireTestAccess(user: SessionUser, id: string) {
  const tenant = requireTenant(user);
  const row = await db.test.findFirst({ where: { id, ...(tenant ? { institutionId: tenant } : {}),
    ...(user.role === "STUDENT" ? { assignments: { some: { studentId: user.studentId ?? "" } } } : {}) } });
  if (!row) throw Object.assign(new Error("Test not found"), { status: 404 });
  return row;
}
export async function requireAttemptAccess(user: SessionUser, id: string) {
  const tenant = requireTenant(user);
  const row = await db.studentTestAttempt.findFirst({ where: { id,
    ...(tenant ? { test: { institutionId: tenant } } : {}),
    ...(user.role === "STUDENT" ? { studentId: user.studentId ?? "" } : {}) } });
  if (!row) throw Object.assign(new Error("Attempt not found"), { status: 404 });
  return row;
}
export async function requireSyllabusInClass(syllabusId: string | undefined, classId: string) {
  if (!syllabusId) return;
  const row = await db.syllabus.findFirst({ where: { id: syllabusId, classId } });
  if (!row) throw Object.assign(new Error("Syllabus not found in this class"), { status: 404 });
}
