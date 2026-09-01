import { withAuth } from "@/lib/with-auth";
import { examService } from "@/services/exam.service";
import { errorJson, json } from "@/lib/utils";
import { z } from "zod";

export async function GET(_: Request, context: { params: Promise<{ examId: string }> }) {
  const { examId } = await context.params;
  return withAuth(async (user) => {
    const exam = await examService.get(examId);
    if (!exam) return errorJson("Exam not found", 404);
    if ((user.role === "INSTITUTION_ADMIN" || user.role === "TEACHER") && exam.institutionId !== user.institutionId) {
      return errorJson("Forbidden", 403);
    }
    return json(exam);
  }, ["INSTITUTION_ADMIN", "TEACHER", "SUPER_ADMIN"]);
}

export async function PATCH(request: Request, context: { params: Promise<{ examId: string }> }) {
  const { examId } = await context.params;
  return withAuth(async (user) => {
    const exam = await examService.get(examId);
    if (!exam) return errorJson("Exam not found", 404);
    if ((user.role === "INSTITUTION_ADMIN" || user.role === "TEACHER") && exam.institutionId !== user.institutionId) {
      return errorJson("Forbidden", 403);
    }
    const body = z
      .object({
        startAt: z.string(),
        endAt: z.string(),
        durationMinutes: z.number().int().min(5),
      })
      .parse(await request.json());
    return json(
      await examService.reschedule(examId, new Date(body.startAt), new Date(body.endAt), body.durationMinutes),
    );
  }, ["INSTITUTION_ADMIN", "TEACHER", "SUPER_ADMIN"]);
}
