import { withAuth } from "@/lib/with-auth";
import { requireTenant } from "@/lib/tenant";
import { studentService } from "@/services/student.service";

export async function POST(_: Request, context: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await context.params;
  return withAuth(async (user) => {
    const result = await studentService.resetPassword(studentId, requireTenant(user)!);
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  }, ["INSTITUTION_ADMIN"]);
}
