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
    const status = (error as { status?: number }).status ?? 500;
    const message = error instanceof Error ? error.message : "Server error";
    return errorJson(message, status);
  }
}
