import { withAuth } from "@/lib/with-auth";
import { requireTenant } from "@/lib/tenant";
import { staffStatusSchema } from "@/lib/validators";
import { httpError, json } from "@/lib/utils";
import { staffService } from "@/services/staff.service";

export async function PATCH(request: Request, context: { params: Promise<{ staffId: string }> }) {
  const { staffId } = await context.params;
  return withAuth(async (user) => {
    const institutionId = requireTenant(user);
    if (!institutionId) throw httpError("Institution required", 403);
    const { status } = staffStatusSchema.parse(await request.json());
    return json(await staffService.setStatus(staffId, institutionId, status));
  }, ["INSTITUTION_ADMIN"]);
}
