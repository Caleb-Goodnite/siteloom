import { getPlan } from "@/config/plans";
import { getProfile, requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NewSite } from "@/components/app/new-site";
import { ProjectGrid, type ProjectCard } from "@/components/app/project-grid";

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const profile = await getProfile(user.id);
  const plan = getPlan(profile.plan);
  const { data } = await supabaseAdmin()
    .from("projects")
    .select("id, name, slug, published, published_at, updated_at, custom_domain, domain_verified, status, blocked")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  const projects = (data ?? []) as ProjectCard[];
  const firstName = profile.full_name?.split(" ")[0];

  return (
    <div>
      <section className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-5xl leading-tight text-ink">
          {projects.length ? `What are we building${firstName ? `, ${firstName}` : ""}?` : `Let's build your first site${firstName ? `, ${firstName}` : ""}`}
        </h1>
        <p className="mt-2 text-ink-2">Describe the business or project. You can refine everything after.</p>
        <div className="mt-7 text-left">
          <NewSite atLimit={projects.length >= plan.maxProjects} maxProjects={plan.maxProjects} />
        </div>
      </section>

      <section className="mt-16">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-ink">Your sites</h2>
          <span className="text-sm text-muted">
            {projects.length} / {plan.maxProjects >= 500 ? "∞" : plan.maxProjects}
          </span>
        </div>
        <ProjectGrid projects={projects} />
      </section>
    </div>
  );
}
