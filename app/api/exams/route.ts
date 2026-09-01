import { withAuth } from "@/lib/with-auth";
import { examService } from "@/services/exam.service";
import { examSchema } from "@/lib/validators";
import { json } from "@/lib/utils";
import { requireTenant } from "@/lib/tenant";

export function GET() {
  return withAuth(async (user) => {
    const institutionId = user.role === "SUPER_ADMIN" ? null : requireTenant(user);
    return json(await examService.list(institutionId));
  }, ["INSTITUTION_ADMIN", "TEACHER", "SUPER_ADMIN"]);
}

export async function POST(request: Request) {
  return withAuth(async (user) => {
    const institutionId = requireTenant(user);
    if (!institutionId) throw Object.assign(new Error("Institution required"), { status: 400 });
    const body = examSchema.parse(await request.json());
    return json(
      await examService.createScheduledExam({
        ...body,
        institutionId,
        createdById: user.id,
        startAt: new Date(body.startAt),
        endAt: new Date(body.endAt),
      }),
      201,
    );
  }, ["INSTITUTION_ADMIN", "TEACHER"]);
}
