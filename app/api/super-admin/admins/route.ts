import { withAuth } from "@/lib/with-auth";
import { db } from "@/lib/db";
import { json } from "@/lib/utils";
import { adminSchema } from "@/lib/validators";
import { hashPassword } from "@/lib/auth";

export function GET() {
  return withAuth(
    async () =>
      json(
        await db.user.findMany({
          where: { role: "INSTITUTION_ADMIN" },
          omit: { passwordHash: true },
          include: { institution: true },
          orderBy: { createdAt: "desc" },
        }),
      ),
    ["SUPER_ADMIN"],
  );
}

export async function POST(request: Request) {
  return withAuth(async () => {
    const body = adminSchema.parse(await request.json());
    const admin = await db.user.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase(),
        passwordHash: await hashPassword(body.password),
        role: "INSTITUTION_ADMIN",
        institutionId: body.institutionId,
      },
    });
    return json({ id: admin.id, name: admin.name, email: admin.email, institutionId: admin.institutionId }, 201);
  }, ["SUPER_ADMIN"]);
}
