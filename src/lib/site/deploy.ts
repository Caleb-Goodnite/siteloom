import "server-only";
import { getPlan } from "@/config/plans";
import { publishedUrl } from "@/config/site";
import { invalidateSite } from "@/lib/site/hosting";
import { buildPublishedSite } from "@/lib/site/publish";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { FileMap, Project } from "@/lib/types";

/** Builds the production copy of a project's current files and makes it live. */
export async function deployProject(project: Project, planId: string, files: FileMap = project.files) {
  const plan = getPlan(planId);
  const url = publishedUrl(project.slug, project.domain_verified ? project.custom_domain : null);
  const build = await buildPublishedSite({
    files,
    siteUrl: url,
    siteName: project.settings?.siteName ?? project.name,
    settings: project.settings ?? {},
    badge: plan.badge,
  });
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin()
    .from("projects")
    .update({
      published: true,
      published_at: now,
      published_files: build.files,
      published_source: files,
      settings: { ...project.settings, brand: build.brand },
    })
    .eq("id", project.id);
  if (error) throw new Error(error.message);
  invalidateSite(project);
  return { url, warnings: build.warnings, publishedAt: now };
}

/** Rebuilds an already-published site (after a domain change or plan change) without new content. */
export async function redeployPublished(projectId: string) {
  const admin = supabaseAdmin();
  const { data: project } = await admin.from("projects").select("*").eq("id", projectId).single();
  if (!project?.published || project.blocked) return;
  const { data: owner } = await admin.from("profiles").select("plan").eq("id", project.user_id).single();
  // Rebuild what was live, not any unpublished edits made since.
  await deployProject(project as Project, owner?.plan ?? "free", (project.published_source ?? project.files) as FileMap);
}
