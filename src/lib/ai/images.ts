import "server-only";
import sharp from "sharp";
import { IMAGE_MODELS } from "@/config/models";
import { generateImage } from "@/lib/ai/openrouter";
import type { ImageRequest } from "@/lib/site/render";
import { ASSETS_BUCKET, supabaseAdmin } from "@/lib/supabase/admin";
import { sha256Hex } from "@/lib/utils";

const STYLE_SUFFIX =
  "Editorial-quality professional photograph, natural light, realistic detail, tasteful composition. No text, no captions, no logos, no watermarks.";

/** Normalizes any image to a web-friendly WebP (max 1600px) and uploads it publicly. */
export async function uploadImage(projectId: string, bytes: Uint8Array, nameHint: string) {
  const webp = await sharp(bytes, { animated: false })
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  const key = `${projectId}/${(await sha256Hex(nameHint + Date.now())).slice(0, 16)}.webp`;
  const storage = supabaseAdmin().storage.from(ASSETS_BUCKET);
  const { error } = await storage.upload(key, webp, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return storage.getPublicUrl(key).data.publicUrl;
}

export async function generateSiteImages(opts: {
  projectId: string;
  userId: string;
  requests: ImageRequest[];
  onProgress?: (done: number, total: number) => void;
}) {
  const urls = new Map<string, string>();
  let costUsd = 0;
  let failed = 0;
  let done = 0;
  const queue = [...opts.requests];

  const worker = async () => {
    while (queue.length) {
      const req = queue.shift()!;
      try {
        const img = await generateImage({
          models: IMAGE_MODELS,
          prompt: `${req.prompt}\n\n${STYLE_SUFFIX}`,
          aspectRatio: req.aspect,
          userId: opts.userId,
        });
        costUsd += img.costUsd;
        urls.set(req.prompt, await uploadImage(opts.projectId, img.bytes, req.prompt));
      } catch (err) {
        failed++;
        console.error("image generation failed", err);
      } finally {
        done++;
        opts.onProgress?.(done, opts.requests.length);
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(3, queue.length) }, worker));
  return { urls, costUsd, failed };
}
