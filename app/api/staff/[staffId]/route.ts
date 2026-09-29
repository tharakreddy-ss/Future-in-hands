import { withAuth } from "@/lib/with-auth";
import { requireTenant } from "@/lib/tenant";
import { staffUpdateSchema } from "@/lib/validators";
import { errorJson, httpError, json } from "@/lib/utils";
import { staffService } from "@/services/staff.service";
import type { SessionUser } from "@/types";

function tenantOf(user: SessionUser) {
  const institutionId = requireTenant(user);
  if (!institutionId) throw httpError("Institution required", 403);
  return institutionId;
}

export async function GET(_: Request, context: { params: Promise<{ staffId: string }> }) {
  const { staffId } = await context.params;
  return withAuth(async (user) => {
    const staff = await staffService.get(staffId, tenantOf(user));
    if (!staff) return errorJson("Staff member not found", 404);
    return json(staff);
  }, ["INSTITUTION_ADMIN"]);
}

export async function PATCH(request: Request, context: { params: Promise<{ staffId: string }> }) {
  const { staffId } = await context.params;
  return withAuth(async (user) => {
    const institutionId = tenantOf(user);
    if (!(await staffService.get(staffId, institutionId))) return errorJson("Staff member not found", 404);
    const body = staffUpdateSchema.parse(await request.json());
    return json(await staffService.update(staffId, institutionId, body));
  }, ["INSTITUTION_ADMIN"]);
}
