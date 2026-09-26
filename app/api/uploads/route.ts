import { withAuth } from "@/lib/with-auth";
import { errorJson, json } from "@/lib/utils";
import { extractText } from "unpdf";
import { extractImageText } from "@/lib/image-ocr";
import { MAX_UPLOAD_BYTES, validUploadSignature } from "@/lib/upload-validation";
export async function POST(request: Request) {
  return withAuth(async () => {
    if (Number(request.headers.get("content-length") ?? 0) > MAX_UPLOAD_BYTES + 65536) return errorJson("Maximum upload size is 10 MB", 413);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.size) return errorJson("File is required", 400);
    if (file.size > MAX_UPLOAD_BYTES) return errorJson("Maximum upload size is 10 MB", 413);
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!validUploadSignature(bytes, file.type)) return errorJson("Upload a valid PDF, JPG, PNG or WebP file", 400);
    let content = "";
    if (file.type === "application/pdf") {
      try {
        const result = await extractText(new Uint8Array(bytes));
        content = (Array.isArray(result.text) ? result.text.join("\n") : String(result.text ?? "")).trim();
      } catch { return errorJson("This PDF could not be read. Upload an unlocked text PDF or paste its content.", 422); }
    } else {
      content = await extractImageText(bytes, file.type);
    }
    if (!content.trim()) return errorJson("No readable text found. For scanned PDFs, upload a page as an image or paste the text.", 422);
    if (content.length > 100000) return errorJson("Please split the document into smaller sections", 413);
    // The original file is processed in memory; only reviewed syllabus text is persisted on save.
    return json({ content, requiresReview: true });
  }, ["INSTITUTION_ADMIN", "TEACHER"]);
}
