import { withAuth } from "@/lib/with-auth";
import { classService } from "@/services/class.service";
import { requireTenant } from "@/lib/tenant";
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
    const { requireClassAccess } = await import("@/lib/resource-access");
    const { classSchema } = await import("@/lib/validators");
    const { db } = await import("@/lib/db");
    await requireClassAccess(user, classId);
    return json(await db.class.update({ where: { id: classId }, data: classSchema.parse(await request.json()) }));
  }, ["INSTITUTION_ADMIN"]);
}
