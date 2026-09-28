import { withAuth } from "@/lib/with-auth";
import { errorJson } from "@/lib/utils";
import { db } from "@/lib/db";
import { readPrivateObject } from "@/lib/private-storage";

export async function GET(
  _: Request,
  context: { params: Promise<{ classId: string; subjectId: string; kind: string }> },
) {
  const { classId, subjectId, kind } = await context.params;
  return withAuth(async (user) => {
    if (!user.studentId) return errorJson("Forbidden", 403);
    if (kind !== "syllabus" && kind !== "material") return errorJson("Not found", 404);

    const enrollment = await db.classStudent.findUnique({
      where: { classId_studentId: { classId, studentId: user.studentId } },
      select: { id: true },
    });
    if (!enrollment) return errorJson("Not found", 404);

    const linked = await db.classSubject.findUnique({
      where: { classId_subjectId: { classId, subjectId } },
      include: {
        subject: {
          select: {
            syllabusFileKey: true,
            syllabusFileName: true,
            materialFileKey: true,
            materialFileName: true,
          },
        },
      },
    });
    if (!linked) return errorJson("Not found", 404);

    const file =
      kind === "syllabus"
        ? { key: linked.subject.syllabusFileKey, name: linked.subject.syllabusFileName }
        : { key: linked.subject.materialFileKey, name: linked.subject.materialFileName };
    if (!file.key || !file.name) return errorJson("File not found", 404);

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
  }, ["STUDENT"]);
}
