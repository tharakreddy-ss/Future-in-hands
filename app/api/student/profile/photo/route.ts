import { randomUUID } from "crypto";
import { withAuth } from "@/lib/with-auth";
import { studentService } from "@/services/student.service";
import { gamificationService } from "@/services/gamification.service";
import { errorJson } from "@/lib/utils";
import { readPrivateObject, savePrivateObject } from "@/lib/private-storage";

const PHOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const PHOTO_LIMIT = 5 * 1024 * 1024;

function contentType(key: string) {
  if (key.endsWith(".png")) return "image/png";
  if (key.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

export async function GET() {
  return withAuth(async (user) => {
    if (!user.studentId) return errorJson("Forbidden", 403);
    const student = await studentService.get(user.studentId);
    if (!student?.photoKey) return errorJson("Photo not found", 404);
    const object = await readPrivateObject("student-photos", student.photoKey);
    if (!object) return errorJson("Photo not found", 404);
    return new Response(object.body, {
      headers: {
        "Content-Type": object.contentType === "application/octet-stream" ? contentType(student.photoKey) : object.contentType,
        "Cache-Control": "private, no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }, ["STUDENT"]);
}

export async function POST(request: Request) {
  return withAuth(async (user) => {
    if (!user.studentId) return errorJson("Forbidden", 403);
    const form = await request.formData();
    const photo = form.get("photo");
    if (!(photo instanceof File) || photo.size === 0) return errorJson("Choose a photo to upload", 400);
    const extension = PHOTO_TYPES[photo.type];
    if (!extension) return errorJson("Photo must be a JPG, PNG or WebP image.", 400);
    if (photo.size > PHOTO_LIMIT) return errorJson("Photo must be 5 MB or smaller.", 413);
    const photoKey = await savePrivateObject("student-photos", `${randomUUID()}.${extension}`, photo, photo.type);
    await studentService.setOwnPhoto(user.studentId, photoKey);
    await gamificationService.recordProfileCompletionIfEligible(user.studentId);
    return Response.json({ ok: true });
  }, ["STUDENT"]);
}
