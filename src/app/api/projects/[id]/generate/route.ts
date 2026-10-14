import { after } from "next/server";
import { z } from "zod";
import { getProfile } from "@/lib/auth";
import { prepareGeneration, runGeneration, type GenEvent } from "@/lib/ai/generate";
import { api, getOwnedProject, requireApiUser } from "@/lib/http";
import { elementSource } from "@/lib/site/render";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Project } from "@/lib/types";

// Long generations need room (Vercel Pro with Fluid Compute allows up to 800s).
export const maxDuration = 800;

type Ctx = { params: Promise<{ id: string }> };

const Body = z.object({
  prompt: z.string().trim().min(1, "Type a message first.").max(8000),
  tier: z.enum(["fast", "standard", "max"]),
  images: z.boolean().default(true),
  selection: z
    .object({ id: z.string().max(200), page: z.string().max(120) })
    .nullable()
    .optional(),
  attachments: z
    .array(z.object({ url: z.string().url().max(500), name: z.string().max(120), kind: z.literal("image") }))
    .max(6)
    .optional(),
});

export const POST = api<Ctx>(async (req, ctx) => {
  const user = await requireApiUser(req);
  const { id } = await ctx.params;
  const body = Body.parse(await req.json());
  const [project, profile] = await Promise.all([getOwnedProject<Project>(id, user.id), getProfile(user.id)]);

  // Only accept attachments we host ourselves.
  const storageBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`;
  const attachments = (body.attachments ?? []).filter((a) => a.url.startsWith(storageBase));

  let selection = null;
  if (body.selection) {
    const html = elementSource(project.files, body.selection.id);
    if (html) selection = { file: body.selection.id.split("#")[0], page: body.selection.page, tag: "", text: "", html };
  }

  // Throws a JSON error (402 credits, 409 busy, 403 plan…) before any streaming starts.
  const prepared = await prepareGeneration({
    profile,
    project,
    prompt: body.prompt,
    tier: body.tier,
    images: body.images,
    selection,
    attachments,
  });

  const encoder = new TextEncoder();
  let open = true;
  let controllerRef: ReadableStreamDefaultController<Uint8Array> | null = null;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller;
    },
    cancel() {
      open = false; // client went away; the job keeps running and saves its result
    },
  });
  const emit = (e: GenEvent) => {
    if (!open || !controllerRef) return;
    try {
      controllerRef.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
    } catch {
      open = false;
    }
  };

  const job = runGeneration(prepared, emit).finally(() => {
    if (open && controllerRef) {
      open = false;
      try {
        controllerRef.close();
      } catch {}
    }
  });
  after(() => job); // keep the function alive even if the browser tab closes

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
});

/** Stop button: the running job notices within a few seconds, aborts and refunds. */
export const DELETE = api<Ctx>(async (req, ctx) => {
  const user = await requireApiUser(req);
  const { id } = await ctx.params;
  await getOwnedProject(id, user.id, "id");
  await supabaseAdmin().from("projects").update({ cancel_requested: true }).eq("id", id).eq("status", "generating");
  return Response.json({ ok: true });
});
