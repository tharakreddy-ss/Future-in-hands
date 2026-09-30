import { withAuth } from "@/lib/with-auth";
import { requireTenant } from "@/lib/tenant";
import { examService } from "@/services/exam.service";
import { errorJson, json } from "@/lib/utils";

export async function GET(_: Request, context: { params: Promise<{ examId: string }> }) {
  const { examId } = await context.params;
  return withAuth(async (user) => {
    const data = await examService.monitor(examId, requireTenant(user));
    if (!data) return errorJson("Exam not found", 404);
    return json(data);
  }, ["INSTITUTION_ADMIN", "TEACHER", "SUPER_ADMIN"]);
}
