import type { PlanId } from "@/config/plans";
import type { ModelTier } from "@/config/models";

/** A site is a flat map of file path → contents (HTML, CSS, JS). */
export type FileMap = Record<string, string>;

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: PlanId;
  billing_interval: "month" | "year" | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  credits_allowance: number;
  credits_bonus: number;
  credits_reset_at: string;
  referral_code: string;
  referred_by: string | null;
  referral_rewarded: boolean;
  is_admin: boolean;
  email_notifications: boolean;
  marketing_emails: boolean;
  welcomed: boolean;
  created_at: string;
};

/** Auditor results for the published site (graded on every publish). */
export type SeoSnapshot = {
  score: number;
  min: number;
  pages: number;
  issues: { page: string; label: string; detail: string; status: "warn" | "fail" }[];
  checkedAt: string;
  /** Live check of the real URL (speed, HTTPS, sitemap/robots as served). */
  live?: { score: number; responseMs: number; checkedAt: string };
};

export type ProjectSettings = {
  formEmail?: string;
  siteName?: string;
  description?: string;
  lang?: string;
  /** Google Search Console verification token, injected as a meta tag. */
  googleVerification?: string;
  /** Owner's Google Analytics 4 measurement ID (G-…) and Meta Pixel ID, added on publish. */
  gaId?: string;
  metaPixelId?: string;
  seo?: SeoSnapshot;
  /** "Redesign my site": the original URL and the content distilled from it (used for the first build). */
  sourceUrl?: string;
  importedContent?: string;
};

export type Project = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  initial_prompt: string | null;
  files: FileMap;
  status: "idle" | "generating";
  generating_since: string | null;
  cancel_requested: boolean;
  published: boolean;
  published_at: string | null;
  published_files: FileMap | null;
  published_version_id: string | null;
  custom_domain: string | null;
  domain_verified: boolean;
  showcase: boolean;
  settings: ProjectSettings;
  blocked: boolean;
  blocked_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectVersion = {
  id: string;
  project_id: string;
  files?: FileMap;
  label: string;
  source: "ai" | "manual" | "restore" | "images" | "text-edit";
  created_at: string;
};

export type Attachment = { url: string; name: string; kind: "image" };

export type Message = {
  id: string;
  project_id: string;
  role: "user" | "assistant";
  content: string;
  tier: ModelTier | null;
  model: string | null;
  status: "streaming" | "done" | "error" | "cancelled";
  credits_charged: number;
  cost_usd: number;
  files_changed: string[];
  version_id: string | null;
  attachments: Attachment[] | null;
  error: string | null;
  created_at: string;
};

export type FormSubmission = {
  id: string;
  project_id: string;
  form_name: string;
  page: string | null;
  data: Record<string, string>;
  read: boolean;
  created_at: string;
};

/** Element picked in the preview, sent with a chat message so the AI edits exactly that. */
export type SelectedElement = {
  file: string;
  page: string;
  tag: string;
  text: string;
  html: string;
};
