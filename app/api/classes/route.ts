import { withAuth } from "@/lib/with-auth";
import { classService } from "@/services/class.service";
import { requireTenant } from "@/lib/tenant";
import { classCreateSchema } from "@/lib/validators";
import { json } from "@/lib/utils";

export function GET() {
  return withAuth(async (user) => {
    const institutionId = requireTenant(user);
    if (!institutionId) return json([]);
    return json(await classService.list(institutionId));
  }, ["INSTITUTION_ADMIN", "TEACHER"]);
}

export async function POST(request: Request) {
  return withAuth(async (user) => {
    const institutionId = requireTenant(user);
    if (!institutionId) throw Object.assign(new Error("Institution required"), { status: 400 });
    const body = classCreateSchema.parse(await request.json());
    return json(
      await classService.create({ ...body, institutionId, createdById: user.id }),
      201,
    );
  }, ["INSTITUTION_ADMIN", "TEACHER"]);
}
