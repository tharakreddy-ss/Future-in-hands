import { NextRequest } from "next/server";
import { authService } from "@/services/auth.service";
import { staffLoginSchema, studentLoginSchema } from "@/lib/validators";
import { errorJson, json } from "@/lib/utils";
import { ROLE_HOME } from "@/lib/permissions";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const user =
      body.mode === "student" || typeof body.studentId === "string"
        ? await authService.loginStudent(
            studentLoginSchema.parse({ mode: "student", ...body }).studentId,
            String(body.password),
          )
        : await authService.loginStaff(
            staffLoginSchema.parse({ mode: "staff", ...body }).email,
            String(body.password),
          );
    return json({ user, redirectTo: ROLE_HOME[user.role] });
  } catch (error) {
    const status = (error as { status?: number }).status ?? 400;
    return errorJson(error instanceof Error ? error.message : "Login failed", status);
  }
}
