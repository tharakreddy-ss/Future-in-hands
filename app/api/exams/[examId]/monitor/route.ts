import { withAuth } from "@/lib/with-auth";
import { examService } from "@/services/exam.service";
import { errorJson, json } from "@/lib/utils";

export async function GET(_: Request, context: { params: Promise<{ examId: string }> }) {
  const { examId } = await context.params;
  return withAuth(async (user) => {
    const data = await examService.monitor(examId);
    if (!data) return errorJson("Exam not found", 404);
    if ((user.role === "INSTITUTION_ADMIN" || user.role === "TEACHER") && data.test.institutionId !== user.institutionId) {
      return errorJson("Forbidden", 403);
    }
    return json(data);
  }, ["INSTITUTION_ADMIN", "TEACHER", "SUPER_ADMIN"]);
}
