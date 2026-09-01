import { withAuth } from "@/lib/with-auth";
import { resultService } from "@/services/result.service";
import { errorJson, json } from "@/lib/utils";

export async function GET(_: Request, context: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await context.params;
  return withAuth(async (user) => {
    const result = await resultService.getByAttempt(attemptId);
    if (!result) return errorJson("Result not found", 404);
    if (user.role === "STUDENT" && result.studentId !== user.studentId) {
      return errorJson("Forbidden", 403);
    }
    return json(result);
  }, ["STUDENT", "INSTITUTION_ADMIN"]);
}
