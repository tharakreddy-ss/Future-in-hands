import { withAuth } from "@/lib/with-auth";
import { db } from "@/lib/db";
import { json } from "@/lib/utils";
import { z } from "zod";
export async function PATCH(request: Request, context: { params: Promise<{ institutionId: string }> }) {
  const { institutionId } = await context.params;
  return withAuth(async () => {
    const data = z.object({ name: z.string().min(2).optional(), status: z.enum(["ACTIVE", "INACTIVE"]).optional() }).parse(await request.json());
    return json(await db.institution.update({ where: { id: institutionId }, data }));
  }, ["SUPER_ADMIN"]);
}
