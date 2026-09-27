import { withAuth } from "@/lib/with-auth";
import { requireTenant } from "@/lib/tenant";
import { errorJson } from "@/lib/utils";
import { subjectService } from "@/services/subject.service";
import { readPrivateObject } from "@/lib/private-storage";

export async function GET(_: Request, context: { params: Promise<{ subjectId: string; kind: string }> }) {
  const { subjectId, kind } = await context.params;
  return withAuth(async (user) => {
    if (user.role !== "INSTITUTION_ADMIN") return errorJson("Forbidden", 403);
    const subject = await subjectService.get(subjectId, requireTenant(user)!);
    if (!subject) return errorJson("Subject not found", 404);
    const file = kind === "syllabus"
      ? { key: subject.syllabusFileKey, name: subject.syllabusFileName }
      : kind === "material"
        ? { key: subject.materialFileKey, name: subject.materialFileName }
        : null;
    if (!file?.key || !file.name) return errorJson("File not found", 404);
    const object = await readPrivateObject("subject-library", file.key);
    if (!object) return errorJson("File not found", 404);
    return new Response(object.body, {
      headers: {
        "Content-Type": object.contentType === "application/octet-stream" ? "application/pdf" : object.contentType,
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
        "Cache-Control": "private, no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }, ["INSTITUTION_ADMIN"]);
}
