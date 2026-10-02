import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { getAuthSecret } from "@/lib/auth-secret";
import type { SessionUser } from "@/types";

export const SESSION_COOKIE = "examly_session";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

function toJwtClaims(user: SessionUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    institutionId: user.institutionId ?? "",
    studentId: user.studentId ?? "",
    studentIdentifier: user.studentIdentifier ?? "",
  };
}

function fromJwtClaims(payload: Record<string, unknown>): SessionUser {
  const str = (key: string) => {
    const value = payload[key];
    return typeof value === "string" && value.length > 0 ? value : null;
  };
  return {
    id: String(payload.id),
    email: String(payload.email),
    name: String(payload.name),
    role: payload.role as Role,
    institutionId: str("institutionId"),
    studentId: str("studentId"),
    studentIdentifier: str("studentIdentifier"),
  };
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT(toJwtClaims(user))
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getAuthSecret());

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export const getSession = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    const claims = fromJwtClaims(payload as Record<string, unknown>);
    const user = await db.user.findUnique({ where: { id: claims.id }, include: { institution: true, student: true } });
    if (!user?.isActive || (user.role !== "SUPER_ADMIN" && user.institution?.status !== "ACTIVE") || (user.role === "STUDENT" && user.student?.status !== "ACTIVE")) return null;
    return { id: user.id, email: user.email, name: user.name, role: user.role, institutionId: user.institutionId, studentId: user.student?.id ?? null, studentIdentifier: user.student?.studentIdentifier ?? null };
  } catch {
    return null;
  }
});

export async function requireSession(roles?: Role[]) {
  const session = await getSession();
  if (!session) throw Object.assign(new Error("Unauthorized"), { status: 401 });
  if (roles && !roles.includes(session.role)) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }
  return session;
}

export async function getUserByEmail(email: string) {
  return db.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { student: true },
  });
}

export async function getStudentByIdentifier(studentIdentifier: string) {
  return db.student.findUnique({
    where: { studentIdentifier: studentIdentifier.trim().toUpperCase() },
    include: { user: true, institution: true },
  });
}
