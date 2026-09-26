import { requireAttemptAccess } from "@/lib/resource-access";
import { withAuth } from "@/lib/with-auth";
import { attemptService } from "@/services/attempt.service";
import { errorJson, json } from "@/lib/utils";

export async function GET(_: Request, context: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await context.params;
  return withAuth(async (user) => {
    await requireAttemptAccess(user, attemptId);
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
    await requireAttemptAccess(user, attemptId);
    const attempt = await attemptService.get(attemptId);
    if (!attempt || attempt.studentId !== user.studentId) return errorJson("Forbidden", 403);
    return json(await attemptService.submit(attemptId));
  }, ["STUDENT"]);
}

export async function PATCH(request: Request, context: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await context.params;
  return withAuth(async (user) => {
    await requireAttemptAccess(user, attemptId);
    const { z } = await import("zod");
    const { db } = await import("@/lib/db");
    const body = z.object({ index: z.number().int().min(0) }).parse(await request.json());
    const attempt = await attemptService.get(attemptId);
    if (!attempt || attempt.status !== "IN_PROGRESS" || body.index >= attempt.test.questions.length) return errorJson("Invalid question position or closed attempt", 400);
    await db.studentTestAttempt.updateMany({ where: { id: attemptId, status: "IN_PROGRESS" }, data: { currentQuestionIndex: body.index } });
    return json({ saved: true });
  }, ["STUDENT"]);
}
