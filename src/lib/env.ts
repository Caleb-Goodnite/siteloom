import "server-only";

function required(name: string, value: string | undefined) {
  if (!value) throw new Error(`Missing environment variable ${name}. See .env.example.`);
  return value;
}

/** Server-only secrets, read lazily so `next build` works before they are configured. */
export const serverEnv = {
  get supabaseSecretKey() {
    return required(
      "SUPABASE_SECRET_KEY",
      process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
  },
  get openrouterKey() {
    return required("OPENROUTER_API_KEY", process.env.OPENROUTER_API_KEY);
  },
  get stripeSecretKey() {
    return required("STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY);
  },
  get stripeWebhookSecret() {
    return required("STRIPE_WEBHOOK_SECRET", process.env.STRIPE_WEBHOOK_SECRET);
  },
  get cronSecret() {
    return process.env.CRON_SECRET;
  },
  get resendKey() {
    return process.env.RESEND_API_KEY;
  },
  get emailFrom() {
    return process.env.EMAIL_FROM;
  },
  get vercelToken() {
    return process.env.VERCEL_TOKEN;
  },
  get vercelProjectId() {
    return process.env.VERCEL_PROJECT_ID;
  },
  get vercelTeamId() {
    return process.env.VERCEL_TEAM_ID;
  },
  /** Hard stop for AI spend per UTC day. Free users are paused at 80% of it. */
  get dailyAiBudgetUsd() {
    return Number(process.env.DAILY_AI_BUDGET_USD || 75);
  },
  get adminEmails() {
    return (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  },
};

export function isConfigured(...names: string[]) {
  return names.every((n) => Boolean(process.env[n]));
}
