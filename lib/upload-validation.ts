export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export function validUploadSignature(bytes: Uint8Array, mime: string) {
  const hex = Buffer.from(bytes.subarray(0, 12)).toString("hex");
  if (mime === "application/pdf") return Buffer.from(bytes.subarray(0, 5)).toString() === "%PDF-";
  if (mime === "image/png") return hex.startsWith("89504e470d0a1a0a");
  if (mime === "image/jpeg") return hex.startsWith("ffd8ff");
  if (mime === "image/webp") return hex.startsWith("52494646") && hex.slice(16) === "57454250";
  return false;
}
