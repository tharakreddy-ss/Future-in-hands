import { createHash } from "crypto";

export function normalizeQuestionText(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function hashQuestionText(text: string) {
  return createHash("sha256").update(normalizeQuestionText(text)).digest("hex");
}
