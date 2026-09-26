import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
const run = promisify(execFile);
export async function extractImageText(bytes: Buffer, mime: string) {
  const directory = await mkdtemp(path.join(tmpdir(), "exam-ocr-"));
  const file = path.join(directory, `input.${mime.split("/")[1]}`);
  try {
    await writeFile(file, bytes, { mode: 0o600 });
    const result = process.platform === "darwin"
      ? await run("/usr/bin/swift", [path.join(process.cwd(), "scripts", "image-ocr.swift"), file], { timeout: 60000, maxBuffer: 1024 * 1024 })
      : await run(process.env.TESSERACT_PATH || "tesseract", [file, "stdout"], { timeout: 60000, maxBuffer: 1024 * 1024 });
    return result.stdout.trim();
  } catch {
    throw Object.assign(new Error("Local image extraction is unavailable. Install Tesseract on the server (or Xcode command-line tools on macOS), or paste the syllabus text."), { status: 503 });
  } finally { await rm(directory, { recursive: true, force: true }); }
}
