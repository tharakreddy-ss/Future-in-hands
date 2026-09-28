import { randomUUID } from "crypto";
import { extractText } from "unpdf";
import { z } from "zod";
import { withAuth } from "@/lib/with-auth";
import { requireTenant } from "@/lib/tenant";
import { errorJson, json } from "@/lib/utils";
import { subjectService, type SubjectPage } from "@/services/subject.service";
import { removePrivateObject, savePrivateObject } from "@/lib/private-storage";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_EXTRACTED_CHARS = 4_000_000;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined);

const subjectMetadataSchema = z.object({
  name: z.string().trim().min(1, "Subject name is required.").max(100),
  code: optionalText(32),
  gradeLevel: optionalText(64),
  curriculum: optionalText(100),
  academicYear: optionalText(32),
  description: optionalText(1200),
});

async function readPdf(form: FormData, field: string) {
  const file = form.get(field);
  if (!(file instanceof File) || file.size === 0) throw Object.assign(new Error(`${field === "syllabus" ? "Syllabus" : "Study material"} PDF is required.`), { status: 400 });
  if (file.size > MAX_FILE_BYTES) throw Object.assign(new Error("Each PDF must be 20 MB or smaller."), { status: 413 });
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") throw Object.assign(new Error("Please upload a valid PDF file."), { status: 400 });
  const extracted = await extractText(new Uint8Array(bytes), { mergePages: false });
  const texts = typeof extracted.text === "string" ? [extracted.text] : extracted.text;
  const pages: SubjectPage[] = texts.map((text, index) => ({ page: index + 1, text: text.trim() }));
  if (pages.reduce((sum, page) => sum + page.text.length, 0) > MAX_EXTRACTED_CHARS) {
    throw Object.assign(new Error("The extracted PDF text is too large to store safely. Split the document and upload smaller parts."), { status: 413 });
  }
  return { file, bytes, pages, key: `${randomUUID()}.pdf` };
}

export function GET() {
  return withAuth(async (user) => {
    if (user.role !== "INSTITUTION_ADMIN") return errorJson("Forbidden", 403);
    return json(await subjectService.list(requireTenant(user)!));
  }, ["INSTITUTION_ADMIN"]);
}

export async function POST(request: Request) {
  return withAuth(async (user) => {
    if (user.role !== "INSTITUTION_ADMIN") return errorJson("Forbidden", 403);
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const metadata = subjectMetadataSchema.parse(await request.json());
      try {
        const subject = await subjectService.create({
          name: metadata.name,
          code: metadata.code,
          description: metadata.description,
          institutionId: requireTenant(user)!,
          createdById: user.id,
        });
        return json({ id: subject.id, name: subject.name, code: subject.code, description: subject.description }, 201);
      } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
          return errorJson("A subject with this name already exists.", 409);
        }
        throw error;
      }
    }
    const form = await request.formData();
    const metadata = subjectMetadataSchema.parse({
      name: form.get("name"),
      code: form.get("code") || undefined,
      gradeLevel: form.get("gradeLevel") || undefined,
      curriculum: form.get("curriculum") || undefined,
      academicYear: form.get("academicYear") || undefined,
      description: form.get("description") || undefined,
    });
    const [syllabus, material] = await Promise.all([readPdf(form, "syllabus"), readPdf(form, "material")]);
    const [syllabusFileKey, materialFileKey] = await Promise.all([
      savePrivateObject("subject-library", syllabus.key, syllabus.bytes, "application/pdf"),
      savePrivateObject("subject-library", material.key, material.bytes, "application/pdf"),
    ]);
    try {
      const subject = await subjectService.create({
        ...metadata,
        institutionId: requireTenant(user)!,
        createdById: user.id,
        syllabusFileKey,
        syllabusFileName: syllabus.file.name,
        syllabusPages: syllabus.pages,
        materialFileKey,
        materialFileName: material.file.name,
        materialPages: material.pages,
      });
      return json({ id: subject.id }, 201);
    } catch (error) {
      await Promise.allSettled([removePrivateObject("subject-library", syllabusFileKey), removePrivateObject("subject-library", materialFileKey)]);
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        return errorJson("A subject with this name already exists.", 409);
      }
      throw error;
    }
  }, ["INSTITUTION_ADMIN"]);
}
