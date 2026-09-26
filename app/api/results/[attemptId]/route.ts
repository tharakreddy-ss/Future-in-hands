import { requireAttemptAccess } from "@/lib/resource-access";
import { withAuth } from "@/lib/with-auth";
import { resultService } from "@/services/result.service";
import { errorJson, json } from "@/lib/utils";

export async function GET(_: Request, context: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await context.params;
  return withAuth(async (user) => {
    await requireAttemptAccess(user, attemptId);
    const result = await resultService.getByAttempt(attemptId);
    if (!result || result.status !== "SUBMITTED") return errorJson("Result not available", 404);
    if (user.role === "STUDENT" && result.studentId !== user.studentId) {
      return errorJson("Forbidden", 403);
    }
    return json(result);
  }, ["STUDENT", "INSTITUTION_ADMIN"]);
}
