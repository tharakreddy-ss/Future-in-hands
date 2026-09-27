import { readFile } from "fs/promises";
import path from "path";
import { withAuth } from "@/lib/with-auth";
import { requireTenant } from "@/lib/tenant";
import { studentService } from "@/services/student.service";
import { errorJson } from "@/lib/utils";

const contentType = (key: string) => key.endsWith(".png") ? "image/png" : key.endsWith(".webp") ? "image/webp" : "image/jpeg";
export async function GET(_: Request, context: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await context.params;
  return withAuth(async (user) => {
    const student = await studentService.get(studentId);
    if (!student?.photoKey || (user.role !== "SUPER_ADMIN" && student.institutionId !== requireTenant(user))) return errorJson("Photo not found", 404);
    try {
      const key = path.basename(student.photoKey);
      const bytes = await readFile(path.join(process.cwd(), ".data", "student-photos", key));
      return new Response(bytes, { headers: { "Content-Type": contentType(key), "Cache-Control": "private, max-age=3600" } });
    } catch { return errorJson("Photo not found", 404); }
  }, ["INSTITUTION_ADMIN", "TEACHER", "SUPER_ADMIN"]);
}
