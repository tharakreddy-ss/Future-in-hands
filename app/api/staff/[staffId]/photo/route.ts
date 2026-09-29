import { randomUUID } from "crypto";
import { withAuth } from "@/lib/with-auth";
import { requireTenant } from "@/lib/tenant";
import { errorJson, httpError, json } from "@/lib/utils";
import { readPrivateObject, removePrivateObject, savePrivateObject } from "@/lib/private-storage";
import { validUploadSignature } from "@/lib/upload-validation";
import { staffService } from "@/services/staff.service";

const FOLDER = "staff-photos";
const PHOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const PHOTO_LIMIT = 5 * 1024 * 1024;

const contentType = (key: string) => (key.endsWith(".png") ? "image/png" : key.endsWith(".webp") ? "image/webp" : "image/jpeg");

export async function GET(_: Request, context: { params: Promise<{ staffId: string }> }) {
  const { staffId } = await context.params;
  return withAuth(async (user) => {
    const institutionId = requireTenant(user);
    if (!institutionId) throw httpError("Institution required", 403);
    const photoKey = await staffService.getPhotoKey(staffId, institutionId);
    if (!photoKey) return errorJson("Photo not found", 404);
    const object = await readPrivateObject(FOLDER, photoKey);
    if (!object) return errorJson("Photo not found", 404);
    return new Response(object.body, {
      headers: {
        "Content-Type": object.contentType === "application/octet-stream" ? contentType(photoKey) : object.contentType,
        "Cache-Control": "private, no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }, ["INSTITUTION_ADMIN"]);
}

export async function POST(request: Request, context: { params: Promise<{ staffId: string }> }) {
  const { staffId } = await context.params;
  return withAuth(async (user) => {
    const institutionId = requireTenant(user);
    if (!institutionId) throw httpError("Institution required", 403);
    if (!(await staffService.get(staffId, institutionId))) return errorJson("Staff member not found", 404);
    if (Number(request.headers.get("content-length") ?? 0) > PHOTO_LIMIT + 64 * 1024) {
      return errorJson("Photo must be 5 MB or smaller.", 413);
    }
    const form = await request.formData();
    const photo = form.get("photo");
    if (!(photo instanceof File) || photo.size === 0) return errorJson("Choose a photo to upload.", 400);
    const extension = PHOTO_TYPES[photo.type];
    if (!extension) return errorJson("Photo must be a JPG, PNG or WebP image.", 400);
    if (photo.size > PHOTO_LIMIT) return errorJson("Photo must be 5 MB or smaller.", 413);
    const bytes = new Uint8Array(await photo.arrayBuffer());
    if (!validUploadSignature(bytes, photo.type)) return errorJson("Photo file does not match its image type.", 400);

    const photoKey = await savePrivateObject(FOLDER, `${randomUUID()}.${extension}`, bytes, photo.type);
    let previous: string | null;
    try {
      previous = await staffService.setPhoto(staffId, institutionId, photoKey);
    } catch (error) {
      await removePrivateObject(FOLDER, photoKey);
      throw error;
    }
    if (previous && previous !== photoKey) await removePrivateObject(FOLDER, previous);
    return json(await staffService.get(staffId, institutionId));
  }, ["INSTITUTION_ADMIN"]);
}
