import { z } from "zod";
import { LIMITS, sanitizePath } from "@/lib/ai/protocol";
import { api, ApiError, getOwnedProject, requireApiUser } from "@/lib/http";
import { invalidateSite } from "@/lib/site/hosting";
import { applyTextEdit } from "@/lib/site/render";
import { ASSETS_BUCKET, supabaseAdmin } from "@/lib/supabase/admin";
import type { FileMap, Project } from "@/lib/types";
import { isValidSlug } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

/** Current project state (used by the builder to resync, e.g. after a reload mid-generation). */
export const GET = api<Ctx>(async (_req, ctx) => {
  const user = await requireApiUser();
  const { id } = await ctx.params;
  const project = await getOwnedProject<Project>(id, user.id);
  const admin = supabaseAdmin();
  const [{ data: messages }, { data: versions }] = await Promise.all([
    admin.from("messages").select("*").eq("project_id", id).order("created_at", { ascending: true }).limit(200),
    admin.from("project_versions").select("id, label, source, created_at").eq("project_id", id).order("created_at", { ascending: false }).limit(100),
  ]);
  const rest: Partial<Project> = { ...project };
  delete rest.published_files;
  return Response.json({ project: rest, messages: messages ?? [], versions: versions ?? [] });
});

const Patch = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  slug: z.string().trim().toLowerCase().optional(),
  showcase: z.boolean().optional(),
  settings: z
    .object({
      formEmail: z.union([z.string().email(), z.literal("")]).optional(),
      siteName: z.string().max(80).optional(),
      description: z.string().max(300).optional(),
      lang: z.string().max(10).optional(),
      googleVerification: z.string().max(100).optional(),
    })
    .optional(),
  /** Manual code edit: full replacement of the given files (null deletes). */
  files: z.record(z.string(), z.string().nullable()).optional(),
  /** Free inline text edit from the preview. */
  textEdit: z.object({ id: z.string().max(200), html: z.string().max(20000) }).optional(),
});

export const PATCH = api<Ctx>(async (req, ctx) => {
  const user = await requireApiUser(req);
  const { id } = await ctx.params;
  const body = Patch.parse(await req.json());
  const project = await getOwnedProject<Project>(id, user.id);
  const admin = supabaseAdmin();
  const update: Record<string, unknown> = {};

  if (body.name) update.name = body.name;
  if (body.showcase !== undefined) update.showcase = body.showcase;
  if (body.settings) update.settings = { ...project.settings, ...body.settings };

  if (body.slug && body.slug !== project.slug) {
    if (!isValidSlug(body.slug)) throw new ApiError(400, "Use 3–48 lowercase letters, numbers and single hyphens.");
    const { data: taken } = await admin.from("projects").select("id").eq("slug", body.slug).maybeSingle();
    if (taken) throw new ApiError(409, "That address is taken. Try another.");
    update.slug = body.slug;
  }

  let files: FileMap | null = null;
  let versionLabel = "";
  let versionSource: "manual" | "text-edit" = "manual";
  if (project.status === "generating" && (body.files || body.textEdit)) {
    throw new ApiError(409, "Wait for the AI to finish before editing.");
  }
  if (body.files) {
    files = { ...project.files };
    for (const [rawPath, content] of Object.entries(body.files)) {
      const path = sanitizePath(rawPath);
      if (!path) throw new ApiError(400, `Invalid file name: ${rawPath}`);
      if (content === null) {
        if (path === "index.html") throw new ApiError(400, "The home page can't be deleted.");
        delete files[path];
      } else {
        if (content.length > LIMITS.maxFileBytes) throw new ApiError(400, `${path} is too large.`);
        files[path] = content;
      }
    }
    if (Object.keys(files).length > LIMITS.maxFiles) throw new ApiError(400, "Too many files.");
    versionLabel = `Edited ${Object.keys(body.files).join(", ")}`.slice(0, 90);
  }
  if (body.textEdit) {
    const next = applyTextEdit(files ?? project.files, body.textEdit.id, body.textEdit.html);
    if (!next) throw new ApiError(409, "That text changed since the preview loaded. Try again.");
    files = next;
    versionLabel = "Edited text";
    versionSource = "text-edit";
  }

  if (files) {
    update.files = files;
    // Collapse bursts of small manual edits into one history entry.
    const { data: last } = await admin
      .from("project_versions")
      .select("id, source, created_at")
      .eq("project_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const recentSame = last && last.source === versionSource && Date.now() - new Date(last.created_at).getTime() < 5 * 60_000;
    if (recentSame) await admin.from("project_versions").update({ files, label: versionLabel }).eq("id", last.id);
    else await admin.from("project_versions").insert({ project_id: id, files, label: versionLabel, source: versionSource });
  }

  if (!Object.keys(update).length) return Response.json({ ok: true });
  const { data, error } = await admin.from("projects").update(update).eq("id", id).select("id, name, slug, showcase, settings, files, updated_at").single();
  if (error) throw new Error(error.message);
  if (update.slug) {
    invalidateSite(project); // old address stops resolving
    invalidateSite({ ...project, slug: update.slug as string }); // new address may have been cached as "not found"
  }
  return Response.json({ project: data });
});

export const DELETE = api<Ctx>(async (req, ctx) => {
  const user = await requireApiUser(req);
  const { id } = await ctx.params;
  const project = await getOwnedProject<Project>(id, user.id, "id, slug, custom_domain, published");
  const admin = supabaseAdmin();
  const { data: objects } = await admin.storage.from(ASSETS_BUCKET).list(id, { limit: 1000 });
  if (objects?.length) await admin.storage.from(ASSETS_BUCKET).remove(objects.map((o) => `${id}/${o.name}`));
  await admin.from("projects").delete().eq("id", id);
  if (project.published) invalidateSite(project);
  return Response.json({ ok: true });
});
