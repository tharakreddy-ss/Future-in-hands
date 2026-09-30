import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { authService } from "@/services/auth.service";
import { staffLoginSchema, studentLoginSchema } from "@/lib/validators";
import { clientIp } from "@/lib/login-throttle";
import { errorJson, json } from "@/lib/utils";
import { ROLE_HOME } from "@/lib/permissions";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const ip = clientIp(request);
    const user =
      body.mode === "student" || typeof body.studentId === "string"
        ? await authService.loginStudent(
            studentLoginSchema.parse({ mode: "student", ...body }).studentId,
            String(body.password),
            ip,
          )
        : await authService.loginStaff(
            staffLoginSchema.parse({ mode: "staff", ...body }).email,
            String(body.password),
            ip,
          );
    return json({ user, redirectTo: ROLE_HOME[user.role] });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return errorJson("Enter a valid login ID and a password of at least 6 characters.", 400);
    }
    const { status, retryAfter } = error as { status?: number; retryAfter?: number };
    if (!status) {
      console.error("Login failed unexpectedly", error instanceof Error ? error.name : "UnknownError");
      return errorJson("Unable to sign in right now. Please try again.", 500);
    }
    const response = errorJson(error instanceof Error ? error.message : "Login failed", status);
    if (retryAfter) response.headers.set("Retry-After", String(retryAfter));
    return response;
  }
}
