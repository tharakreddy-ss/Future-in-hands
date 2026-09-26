import { ZodError } from "zod";
import { requireSession } from "@/lib/auth";
import { errorJson } from "@/lib/utils";
import type { Role } from "@prisma/client";
import type { SessionUser } from "@/types";

export async function withAuth(
  handler: (user: SessionUser) => Promise<Response>,
  roles?: Role[],
) {
  try {
    const user = await requireSession(roles);
    return await handler(user);
  } catch (error) {
    if (error instanceof ZodError) return errorJson(error.issues.map((issue) => issue.message).join("; "), 400);
    if (error instanceof SyntaxError) return errorJson("Invalid request body", 400);
    const code = (error as { code?: string }).code;
    if (code === "P2002") return errorJson("This record already exists. Use a unique email or identifier.", 409);
    if (code === "P2025") return errorJson("Record not found", 404);
    const status = (error as { status?: number }).status ?? 500;
    const message = error instanceof Error ? error.message : "Server error";
    return errorJson(status === 500 ? "Unable to complete the request" : message, status);
  }
}
