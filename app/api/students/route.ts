import { withAuth } from "@/lib/with-auth";
import { studentService } from "@/services/student.service";
import { requireTenant } from "@/lib/tenant";
import { studentSchema } from "@/lib/validators";
import { json } from "@/lib/utils";

export function GET(request: Request) {
  return withAuth(async (user) => {
    const institutionId = requireTenant(user);
    if (!institutionId) return json([]);
    const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    if (!q) return json([]);
    const rows = await studentService.search(institutionId, q);
    return json(
      rows.map((student) => {
        const enrollment = student.enrollments[0];
        return {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          name: `${student.firstName} ${student.lastName}`.trim(),
          studentIdentifier: student.studentIdentifier,
          status: student.status,
          className: enrollment?.class.name ?? "Unassigned",
          section: enrollment?.class.subject ?? "—",
        };
      }),
    );
  }, ["INSTITUTION_ADMIN", "TEACHER"]);
}

export async function POST(request: Request) {
  return withAuth(async (user) => {
    const institutionId = requireTenant(user);
    if (!institutionId) throw Object.assign(new Error("Institution required"), { status: 400 });
    const body = studentSchema.parse(await request.json());
    return json(await studentService.create({ ...body, institutionId }), 201);
  }, ["INSTITUTION_ADMIN", "TEACHER"]);
}
