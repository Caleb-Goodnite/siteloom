import { api, ApiError, getOwnedProject, requireApiUser } from "@/lib/http";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { FileMap, Project } from "@/lib/types";

type Ctx = { params: Promise<{ id: string; vid: string }> };

async function loadVersion(projectId: string, versionId: string) {
  const { data } = await supabaseAdmin()
    .from("project_versions")
    .select("id, label, files, created_at")
    .eq("id", versionId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (!data) throw new ApiError(404, "Version not found");
  return data as { id: string; label: string; files: FileMap; created_at: string };
}

/** Files of a past version, for previewing it. */
export const GET = api<Ctx>(async (_req, ctx) => {
  const user = await requireApiUser();
  const { id, vid } = await ctx.params;
  await getOwnedProject(id, user.id, "id");
  return Response.json(await loadVersion(id, vid));
});

/** Restore: free, and itself recorded as a new version so it can be undone. */
export const POST = api<Ctx>(async (req, ctx) => {
  const user = await requireApiUser(req);
  const { id, vid } = await ctx.params;
  const project = await getOwnedProject<Project>(id, user.id, "id, status");
  if (project.status === "generating") throw new ApiError(409, "Wait for the AI to finish first.");
  const version = await loadVersion(id, vid);
  const admin = supabaseAdmin();
  await admin.from("projects").update({ files: version.files }).eq("id", id);
  const { data: created } = await admin
    .from("project_versions")
    .insert({ project_id: id, files: version.files, label: `Restored “${version.label.slice(0, 60)}”`, source: "restore" })
    .select("id, label, source, created_at")
    .single();
  return Response.json({ files: version.files, version: created });
});
