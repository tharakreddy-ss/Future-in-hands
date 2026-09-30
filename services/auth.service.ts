import { randomBytes } from "crypto";
import { createSession, getStudentByIdentifier, getUserByEmail, hashPassword, verifyPassword } from "@/lib/auth";
import { clearAccountFailures, loginRetryAfter, loginThrottleKeys, recordLoginFailure, type ThrottleKey } from "@/lib/login-throttle";
import { httpError } from "@/lib/utils";
import type { SessionUser } from "@/types";

function toSession(user: {
  id: string;
  email: string;
  name: string;
  role: SessionUser["role"];
  institutionId: string | null;
  student?: { id: string; studentIdentifier: string } | null;
}): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    institutionId: user.institutionId,
    studentId: user.student?.id ?? null,
    studentIdentifier: user.student?.studentIdentifier ?? null,
  };
}

let dummyHash: Promise<string> | undefined;

/** Compares against a throwaway hash when the account is unknown so response time does not reveal it. */
async function passwordMatches(password: string, hash: string | undefined) {
  if (hash) return verifyPassword(password, hash);
  dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
  await verifyPassword(password, await dummyHash);
  return false;
}

async function guard(keys: ThrottleKey[]) {
  const retryAfter = await loginRetryAfter(keys);
  if (retryAfter > 0) {
    const minutes = Math.ceil(retryAfter / 60);
    throw Object.assign(
      httpError(`Too many sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`, 429),
      { retryAfter },
    );
  }
}

async function reject(keys: ThrottleKey[], message: string): Promise<never> {
  await recordLoginFailure(keys);
  throw httpError(message, 401);
}

export const authService = {
  async loginStaff(email: string, password: string, ip: string | null = null): Promise<SessionUser> {
    const keys = loginThrottleKeys(`staff:${email}`, ip);
    await guard(keys);
    const user = await getUserByEmail(email);
    const account = user && user.role !== "STUDENT" ? user : null;
    if (!(await passwordMatches(password, account?.passwordHash)) || !account) {
      return reject(keys, "Invalid email or password");
    }
    await clearAccountFailures(keys);
    if (!account.isActive) throw httpError("This account is deactivated", 403);
    const session = toSession(account);
    await createSession(session);
    return session;
  },

  async loginStudent(studentIdentifier: string, password: string, ip: string | null = null): Promise<SessionUser> {
    const keys = loginThrottleKeys(`student:${studentIdentifier}`, ip);
    await guard(keys);
    const student = await getStudentByIdentifier(studentIdentifier);
    if (!(await passwordMatches(password, student?.user.passwordHash)) || !student) {
      return reject(keys, "Invalid student ID or password");
    }
    await clearAccountFailures(keys);
    if (student.status !== "ACTIVE" || !student.user.isActive) {
      throw httpError("This student account is deactivated", 403);
    }
    const session = toSession({ ...student.user, student });
    await createSession(session);
    return session;
  },
};
