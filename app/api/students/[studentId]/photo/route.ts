import { withAuth } from "@/lib/with-auth";
import { requireTenant } from "@/lib/tenant";
import { studentService } from "@/services/student.service";
import { errorJson } from "@/lib/utils";
import { readPrivateObject } from "@/lib/private-storage";

const contentType = (key: string) => key.endsWith(".png") ? "image/png" : key.endsWith(".webp") ? "image/webp" : "image/jpeg";
export async function GET(_: Request, context: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await context.params;
  return withAuth(async (user) => {
    const student = await studentService.get(studentId);
    if (!student?.photoKey || (user.role !== "SUPER_ADMIN" && student.institutionId !== requireTenant(user))) return errorJson("Photo not found", 404);
    const object = await readPrivateObject("student-photos", student.photoKey);
    if (!object) return errorJson("Photo not found", 404);
    return new Response(object.body, { headers: { "Content-Type": object.contentType === "application/octet-stream" ? contentType(student.photoKey) : object.contentType, "Cache-Control": "private, no-cache", "X-Content-Type-Options": "nosniff" } });
  }, ["INSTITUTION_ADMIN", "TEACHER", "SUPER_ADMIN"]);
}
