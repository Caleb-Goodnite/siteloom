/**
 * AI models, routed through OpenRouter. Each tier lists a primary model followed by
 * fallbacks; OpenRouter automatically tries the next one if a provider is down,
 * so a single outage never takes the builder offline.
 *
 * Model IDs and prices were checked against https://openrouter.ai/api/v1/models on 2026-10-14.
 * Override any list with env vars (comma-separated), e.g. MODELS_STANDARD="anthropic/claude-sonnet-5.5,openai/gpt-6.1-sol".
 */
export type ModelTier = "fast" | "standard" | "max";

export type TierConfig = {
  id: ModelTier;
  label: string;
  blurb: string;
  /** Flat credit price per message — shown to the user before they hit send. */
  credits: number;
  models: string[];
  maxTokens: number;
  reasoning: "low" | "medium" | null;
};

function fromEnv(name: string, fallback: string[]) {
  const raw = process.env[name];
  return raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : fallback;
}

export const TIERS: Record<ModelTier, TierConfig> = {
  fast: {
    id: "fast",
    label: "Fast",
    blurb: "Quick edits and copy changes",
    credits: 1,
    // Haiku 5.5: $0.10 / $0.50 per M tokens — roughly half a cent per message.
    models: fromEnv("MODELS_FAST", ["anthropic/claude-haiku-5.5", "google/gemini-3.8-flash", "deepseek/deepseek-v4.1-flash"]),
    maxTokens: 32_000,
    reasoning: null,
  },
  standard: {
    id: "standard",
    label: "Standard",
    blurb: "Best for new sites and redesigns",
    credits: 4,
    // Sonnet 5.5: $2 / $10 per M tokens — strongest design + HTML quality per dollar.
    models: fromEnv("MODELS_STANDARD", ["anthropic/claude-sonnet-5.5", "openai/gpt-6.1-sol", "google/gemini-4-argon"]),
    maxTokens: 40_000,
    reasoning: "low",
  },
  max: {
    id: "max",
    label: "Max",
    blurb: "Most capable, for complex multi-page builds",
    credits: 10,
    // Opus 5.5: $4 / $20 per M tokens.
    models: fromEnv("MODELS_MAX", ["anthropic/claude-opus-5.5", "anthropic/claude-sonnet-5.5"]),
    maxTokens: 48_000,
    reasoning: "medium",
  },
};

/** Cheap model for background jobs: prompt enhancement, moderation, SEO metadata. */
export const UTILITY_MODELS = fromEnv("MODELS_UTILITY", ["anthropic/claude-haiku-5.5", "google/gemini-3.8-flash"]);

/**
 * Photo generation via OpenRouter's Images API (POST /api/v1/images), tried in order.
 * Seedream 5 Flash ≈ $0.018/image, FLUX.2 Klein ≈ $0.014/megapixel, Recraft 4.1 Flash ≈ $0.007/image.
 */
export const IMAGE_MODELS = fromEnv("MODELS_IMAGE", [
  "bytedance-seed/seedream-5-0-flash",
  "black-forest-labs/flux.2-klein-4b",
  "recraft/recraft-v4.1-flash",
]);

export const IMAGE_CREDITS = 1;
export const MAX_IMAGES_PER_MESSAGE = 6;
