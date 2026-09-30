import { withAuth } from "@/lib/with-auth";
import { classService } from "@/services/class.service";
import { requireTenant } from "@/lib/tenant";
import { classUpdateSchema } from "@/lib/validators";
import { errorJson, json } from "@/lib/utils";

export async function GET(_: Request, context: { params: Promise<{ classId: string }> }) {
  const { classId } = await context.params;
  return withAuth(async (user) => {
    const tenant = user.role === "SUPER_ADMIN" ? undefined : requireTenant(user);
    const cls = await classService.get(classId, tenant);
    if (!cls) return errorJson("Class not found", 404);
    return json(cls);
  }, ["INSTITUTION_ADMIN", "SUPER_ADMIN"]);
}

export async function PATCH(request: Request, context: { params: Promise<{ classId: string }> }) {
  const { classId } = await context.params;
  return withAuth(async (user) => {
    const input = classUpdateSchema.parse(await request.json());
    return json(await classService.update(classId, requireTenant(user)!, input));
  }, ["INSTITUTION_ADMIN"]);
}
