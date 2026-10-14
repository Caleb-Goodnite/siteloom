import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Builder } from "@/components/builder/builder";
import { getPlan } from "@/config/plans";
import { getProfile, requireUser } from "@/lib/auth";
import { totalCredits } from "@/lib/credits";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Message, Project, ProjectVersion } from "@/lib/types";

export const metadata: Metadata = { title: "Builder", robots: { index: false } };

type Props = { params: Promise<{ id: string }> };

export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser(`/project/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const admin = supabaseAdmin();

  const [profile, { data: project }, { data: messages }, { data: versions }] = await Promise.all([
    getProfile(user.id),
    admin
      .from("projects")
      .select("id, user_id, name, slug, initial_prompt, files, status, generating_since, cancel_requested, published, published_at, published_version_id, custom_domain, domain_verified, showcase, settings, blocked, blocked_reason, created_at, updated_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
    admin.from("messages").select("*").eq("project_id", id).order("created_at", { ascending: true }).limit(200),
    admin.from("project_versions").select("id, project_id, label, source, created_at").eq("project_id", id).order("created_at", { ascending: false }).limit(100),
  ]);
  if (!project) notFound();

  const { files, ...rest } = project as Project;
  const plan = getPlan(profile.plan);

  return (
    <Builder
      project={rest}
      files={files ?? {}}
      messages={(messages ?? []) as Message[]}
      versions={(versions ?? []) as ProjectVersion[]}
      credits={totalCredits(profile)}
      plan={{ id: plan.id, name: plan.name, tiers: plan.tiers, aiImages: plan.aiImages, customDomains: plan.customDomains, badge: plan.badge }}
    />
  );
}
