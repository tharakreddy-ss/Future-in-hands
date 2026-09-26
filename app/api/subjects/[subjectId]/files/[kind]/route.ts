import { readFile } from "fs/promises";
import path from "path";
import { withAuth } from "@/lib/with-auth";
import { requireTenant } from "@/lib/tenant";
import { errorJson } from "@/lib/utils";
import { subjectService } from "@/services/subject.service";

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
    const directory = process.env.FUTURE_HANDS_PRIVATE_UPLOAD_DIR ?? path.join(process.cwd(), ".data", "subject-library");
    const bytes = await readFile(path.join(directory, path.basename(file.key)));
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }, ["INSTITUTION_ADMIN"]);
}
