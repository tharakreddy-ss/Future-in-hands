import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { extractText } from "unpdf";
import { z } from "zod";
import { withAuth } from "@/lib/with-auth";
import { requireTenant } from "@/lib/tenant";
import { errorJson, json } from "@/lib/utils";
import { subjectService, type SubjectPage } from "@/services/subject.service";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_EXTRACTED_CHARS = 4_000_000;
const privateDir = () => process.env.FUTURE_HANDS_PRIVATE_UPLOAD_DIR ?? path.join(process.cwd(), ".data", "subject-library");

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
    const form = await request.formData();
    const metadata = z.object({
      name: z.string().trim().min(2).max(100),
      code: z.string().trim().max(32).optional(),
      gradeLevel: z.string().trim().max(64).optional(),
      curriculum: z.string().trim().max(100).optional(),
      academicYear: z.string().trim().max(32).optional(),
      description: z.string().trim().max(1200).optional(),
    }).parse({
      name: form.get("name"),
      code: form.get("code") || undefined,
      gradeLevel: form.get("gradeLevel") || undefined,
      curriculum: form.get("curriculum") || undefined,
      academicYear: form.get("academicYear") || undefined,
      description: form.get("description") || undefined,
    });
    const [syllabus, material] = await Promise.all([readPdf(form, "syllabus"), readPdf(form, "material")]);
    const directory = privateDir();
    await mkdir(directory, { recursive: true });
    const syllabusPath = path.join(directory, syllabus.key);
    const materialPath = path.join(directory, material.key);
    await Promise.all([writeFile(syllabusPath, syllabus.bytes, { flag: "wx" }), writeFile(materialPath, material.bytes, { flag: "wx" })]);
    try {
      const subject = await subjectService.create({
        ...metadata,
        institutionId: requireTenant(user)!,
        createdById: user.id,
        syllabusFileKey: syllabus.key,
        syllabusFileName: syllabus.file.name,
        syllabusPages: syllabus.pages,
        materialFileKey: material.key,
        materialFileName: material.file.name,
        materialPages: material.pages,
      });
      return json({ id: subject.id }, 201);
    } catch (error) {
      await Promise.allSettled([unlink(syllabusPath), unlink(materialPath)]);
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        return errorJson("A subject with this name already exists in your institute.", 409);
      }
      throw error;
    }
  }, ["INSTITUTION_ADMIN"]);
}
