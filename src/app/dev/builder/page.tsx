import { notFound } from "next/navigation";
import { Builder } from "@/components/builder/builder";
import { PLANS } from "@/config/plans";
import { site } from "../../../../test/fixtures";

/** Development-only playground: the builder UI with fixture data (no auth or database). */
export default function DevBuilderPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const now = new Date().toISOString();
  const plan = PLANS.pro;
  return (
    <Builder
      project={{
        id: "00000000-0000-0000-0000-000000000000",
        user_id: "dev",
        name: "Bright Smile Dental",
        slug: "bright-smile",
        initial_prompt: null,
        status: "idle",
        generating_since: null,
        cancel_requested: false,
        published: false,
        published_at: null,
        published_version_id: null,
        custom_domain: null,
        domain_verified: false,
        showcase: false,
        settings: { siteName: "Bright Smile Dental" },
        blocked: false,
        blocked_reason: null,
        created_at: now,
        updated_at: now,
      }}
      files={site}
      messages={[
        { id: "m1", project_id: "p", role: "user", content: "A site for Bright Smile Dental in Columbus.", tier: "standard", model: null, status: "done", credits_charged: 0, cost_usd: 0, files_changed: [], version_id: null, attachments: null, error: null, created_at: now },
        { id: "m2", project_id: "p", role: "assistant", content: "I built a calm, trustworthy site with **3 pages** and an appointment form.\n\n- Home, Services, Contact\n- Dentist structured data", tier: "standard", model: "anthropic/claude-sonnet-5.5", status: "done", credits_charged: 4, cost_usd: 0.08, files_changed: Object.keys(site), version_id: "v1", attachments: null, error: null, created_at: now },
      ]}
      versions={[{ id: "v1", project_id: "p", label: "A site for Bright Smile Dental in Columbus.", source: "ai", created_at: now }]}
      credits={812}
      plan={{ id: plan.id, name: plan.name, tiers: plan.tiers, aiImages: plan.aiImages, customDomains: plan.customDomains, badge: plan.badge }}
    />
  );
}
