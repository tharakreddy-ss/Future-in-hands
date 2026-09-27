import { del, get, put } from "@vercel/blob";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

const localRoot = () => process.env.FUTURE_HANDS_PRIVATE_UPLOAD_DIR ?? path.join(process.cwd(), ".data");
const usesBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export function privateObjectKey(folder: string, key: string) {
  return `${folder}/${path.basename(key)}`;
}

export async function savePrivateObject(folder: string, key: string, content: Blob | Uint8Array, contentType: string) {
  const objectKey = privateObjectKey(folder, key);
  const bytes = content instanceof Blob ? Buffer.from(await content.arrayBuffer()) : Buffer.from(content);
  if (usesBlob()) {
    await put(objectKey, content instanceof Blob ? content : bytes, { access: "private", addRandomSuffix: false, contentType });
    return `blob:${objectKey}`;
  }
  const directory = path.join(localRoot(), folder);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, path.basename(key)), bytes, { flag: "wx" });
  return key;
}

export async function readPrivateObject(folder: string, key: string) {
  if (key.startsWith("blob:")) {
    const result = await get(key.slice(5), { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    return { body: result.stream, contentType: result.blob.contentType || "application/octet-stream" };
  }
  try {
    const bytes = await readFile(path.join(localRoot(), folder, path.basename(key)));
    return { body: bytes, contentType: "application/octet-stream" };
  } catch { return null; }
}

export async function removePrivateObject(folder: string, key: string) {
  if (key.startsWith("blob:")) { await del(key.slice(5)); return; }
  await unlink(path.join(localRoot(), folder, path.basename(key))).catch(() => undefined);
}
