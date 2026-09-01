import { createSession, getStudentByIdentifier, getUserByEmail, verifyPassword } from "@/lib/auth";
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

export const authService = {
  async loginStaff(email: string, password: string): Promise<SessionUser> {
    const user = await getUserByEmail(email);
    if (!user || user.role === "STUDENT") {
      throw httpError("Invalid email or password", 401);
    }
    if (!user.isActive) throw httpError("This account is deactivated", 403);
    if (!(await verifyPassword(password, user.passwordHash))) {
      throw httpError("Invalid email or password", 401);
    }
    const session = toSession(user);
    await createSession(session);
    return session;
  },

  async loginStudent(studentIdentifier: string, password: string): Promise<SessionUser> {
    const student = await getStudentByIdentifier(studentIdentifier);
    if (!student) throw httpError("Invalid student ID or password", 401);
    if (student.status !== "ACTIVE" || !student.user.isActive) {
      throw httpError("This student account is deactivated", 403);
    }
    if (!(await verifyPassword(password, student.user.passwordHash))) {
      throw httpError("Invalid student ID or password", 401);
    }
    const session = toSession({ ...student.user, student });
    await createSession(session);
    return session;
  },
};
