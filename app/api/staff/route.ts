import { withAuth } from "@/lib/with-auth";
import { requireTenant } from "@/lib/tenant";
import { staffCreateSchema, staffListQuerySchema } from "@/lib/validators";
import { httpError, json } from "@/lib/utils";
import { staffService } from "@/services/staff.service";
import type { SessionUser } from "@/types";

function tenantOf(user: SessionUser) {
  const institutionId = requireTenant(user);
  if (!institutionId) throw httpError("Institution required", 403);
  return institutionId;
}

export function GET(request: Request) {
  return withAuth(async (user) => {
    const params = new URL(request.url).searchParams;
    const filters = staffListQuerySchema.parse({
      q: params.get("q") ?? undefined,
      category: params.get("category") || undefined,
      status: params.get("status") || undefined,
    });
    return json(await staffService.list(tenantOf(user), filters));
  }, ["INSTITUTION_ADMIN"]);
}

export async function POST(request: Request) {
  return withAuth(async (user) => {
    const body = staffCreateSchema.parse(await request.json());
    return json(await staffService.create(tenantOf(user), body), 201);
  }, ["INSTITUTION_ADMIN"]);
}
