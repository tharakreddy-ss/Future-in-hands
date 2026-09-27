import { withAuth } from "@/lib/with-auth";
import { studentService } from "@/services/student.service";
import { requireTenant } from "@/lib/tenant";
import { studentSchema } from "@/lib/validators";
import { json } from "@/lib/utils";
import { randomUUID } from "crypto";
import { savePrivateObject } from "@/lib/private-storage";

const PHOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const PHOTO_LIMIT = 5 * 1024 * 1024;

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
    const form = await request.formData();
    const photo = form.get("photo");
    let photoKey: string | undefined;
    if (photo instanceof File && photo.size > 0) {
      const extension = PHOTO_TYPES[photo.type];
      if (!extension) throw Object.assign(new Error("Student photo must be a JPG, PNG or WebP image."), { status: 400 });
      if (photo.size > PHOTO_LIMIT) throw Object.assign(new Error("Student photo must be 5 MB or smaller."), { status: 413 });
      photoKey = await savePrivateObject("student-photos", `${randomUUID()}.${extension}`, photo, photo.type);
    }
    const body = studentSchema.parse({
      firstName: form.get("firstName") || undefined, lastName: form.get("lastName") || undefined, name: form.get("name") || undefined,
      email: form.get("email"), phone: form.get("phone") || undefined, password: form.get("password") || undefined, classId: form.get("classId") || undefined,
      dateOfBirth: form.get("dateOfBirth") || undefined, gender: form.get("gender") || undefined, guardianName: form.get("guardianName") || undefined,
      guardianPhone: form.get("guardianPhone") || undefined, address: form.get("address") || undefined, academicYear: form.get("academicYear") || undefined, rollNumber: form.get("rollNumber") || undefined,
    });
    return json(await studentService.create({ ...body, photoKey, institutionId }), 201);
  }, ["INSTITUTION_ADMIN", "TEACHER"]);
}
