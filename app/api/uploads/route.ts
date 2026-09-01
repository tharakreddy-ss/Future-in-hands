import { withAuth } from "@/lib/with-auth";
import { errorJson, json } from "@/lib/utils";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { extractText } from "unpdf";

export async function POST(request: Request) {
  return withAuth(async () => {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return errorJson("File is required", 400);
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) return errorJson("Unsupported file type", 400);

    const bytes = Buffer.from(await file.arrayBuffer());
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const name = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;
    const filePath = path.join(dir, name);
    await writeFile(filePath, bytes);
    const fileUrl = `/uploads/${name}`;

    let content = "";
    if (file.type === "application/pdf") {
      try {
        const result = await extractText(new Uint8Array(bytes));
        content = (Array.isArray(result.text) ? result.text.join("\n") : String(result.text ?? "")).trim();
      } catch {
        content = "";
      }
    }

    return json({
      fileUrl,
      content:
        content ||
        `Uploaded ${file.name}. Edit this extracted text with the topics you want the AI to cover.`,
    });
  }, ["INSTITUTION_ADMIN", "TEACHER"]);
}
