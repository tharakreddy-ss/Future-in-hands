import { withAuth } from "@/lib/with-auth";
import { db } from "@/lib/db";
import { json } from "@/lib/utils";

export function GET() {
  return withAuth(
    async () =>
      json(
        await db.institution.findMany({
          select: {
            id: true,
            name: true,
            subscriptionPlan: true,
            subscriptionStatus: true,
            status: true,
          },
          orderBy: { createdAt: "desc" },
        }),
      ),
    ["SUPER_ADMIN"],
  );
}
