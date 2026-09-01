import { withAuth } from "@/lib/with-auth";
import { attemptService } from "@/services/attempt.service";
import { errorJson, json } from "@/lib/utils";

export async function GET(_: Request, context: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await context.params;
  return withAuth(async (user) => {
    const attempt = await attemptService.get(attemptId);
    if (!attempt) return errorJson("Attempt not found", 404);
    if (user.role === "STUDENT" && attempt.studentId !== user.studentId) {
      return errorJson("Forbidden", 403);
    }
    return json(attempt);
  }, ["STUDENT", "INSTITUTION_ADMIN"]);
}

export async function POST(_: Request, context: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await context.params;
  return withAuth(async (user) => {
    const attempt = await attemptService.get(attemptId);
    if (!attempt || attempt.studentId !== user.studentId) return errorJson("Forbidden", 403);
    return json(await attemptService.submit(attemptId));
  }, ["STUDENT"]);
}
