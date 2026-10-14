import { uploadImage } from "@/lib/ai/images";
import { api, ApiError, getOwnedProject, rateLimit, requireApiUser } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

const MAX_BYTES = 8 * 1024 * 1024;
const TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"]);

/** Upload a logo/photo/screenshot. Re-encoded to WebP (strips metadata, caps size). */
export const POST = api<Ctx>(async (req, ctx) => {
  const user = await requireApiUser(req);
  const { id } = await ctx.params;
  await getOwnedProject(id, user.id, "id");
  if (!(await rateLimit(`upload:${user.id}`, 60, 3600))) throw new ApiError(429, "Too many uploads. Try again later.");

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new ApiError(400, "No file received.");
  if (!TYPES.has(file.type)) throw new ApiError(400, "Upload a PNG, JPG, WebP, GIF or AVIF image.");
  if (file.size > MAX_BYTES) throw new ApiError(400, "Images must be under 8 MB.");

  try {
    const url = await uploadImage(id, new Uint8Array(await file.arrayBuffer()), file.name);
    return Response.json({ url, name: file.name.slice(0, 120), kind: "image" });
  } catch (err) {
    console.error(err);
    throw new ApiError(400, "That image couldn't be processed. Try a different file.");
  }
});
