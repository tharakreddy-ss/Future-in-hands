import { withAuth } from "@/lib/with-auth";
import { studentService } from "@/services/student.service";
import { requireTenant } from "@/lib/tenant";
import { studentUpdateSchema } from "@/lib/validators";
import { errorJson, json } from "@/lib/utils";

export async function GET(_: Request, context: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await context.params;
  return withAuth(async (user) => {
    const student = await studentService.get(studentId);
    if (!student) return errorJson("Student not found", 404);
    const tenant = requireTenant(user);
    if (user.role !== "SUPER_ADMIN" && student.institutionId !== tenant) {
      return errorJson("Student not found", 404);
    }
    return json(student);
  }, ["INSTITUTION_ADMIN", "TEACHER", "SUPER_ADMIN"]);
}

export async function PATCH(request: Request, context: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await context.params;
  return withAuth(async (user) => {
    const existing = await studentService.get(studentId);
    if (!existing) return errorJson("Student not found", 404);
    const tenant = requireTenant(user);
    if (existing.institutionId !== tenant) return errorJson("Student not found", 404);
    const body = studentUpdateSchema.parse(await request.json());
    return json(await studentService.update(studentId, body));
  }, ["INSTITUTION_ADMIN", "TEACHER"]);
}
