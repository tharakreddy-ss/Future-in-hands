import { withAuth } from "@/lib/with-auth";
import { db } from "@/lib/db";
import { errorJson } from "@/lib/utils";
import { readPrivateObject } from "@/lib/private-storage";
import { gamificationService } from "@/services/gamification.service";

function contentType(key: string) {
  if (key.endsWith(".png")) return "image/png";
  if (key.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

export async function GET(_request: Request, context: { params: Promise<{ studentId: string }> }) {
  return withAuth(async (user) => {
    if (!user.studentId) return errorJson("Forbidden", 403);
    const { studentId } = await context.params;
    if (!(await gamificationService.sharesCurrentClass(user.studentId, studentId))) return errorJson("Photo not found", 404);
    const student = await db.student.findUnique({ where: { id: studentId }, select: { photoKey: true } });
    if (!student?.photoKey) return errorJson("Photo not found", 404);
    const object = await readPrivateObject("student-photos", student.photoKey);
    if (!object) return errorJson("Photo not found", 404);
    return new Response(object.body, {
      headers: {
        "Content-Type": object.contentType === "application/octet-stream" ? contentType(student.photoKey) : object.contentType,
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }, ["STUDENT"]);
}
