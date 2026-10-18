/**
 * AI models, routed through OpenRouter. Each tier lists a primary model followed by
 * fallbacks; OpenRouter automatically tries the next one if a provider is down,
 * so a single outage never takes the builder offline.
 *
 * Model IDs are checked against OpenRouter; prices are a snapshot and may change.
 * Override any list with env vars (comma-separated), e.g. MODELS_STANDARD="x-ai/grok-4.7,anthropic/claude-sonnet-5.5".
 */
export type ModelTier = "fast" | "standard" | "max";

export type TierConfig = {
  id: ModelTier;
  label: string;
  blurb: string;
  /** Flat credit price per message — shown to the user before they hit send. */
  credits: number;
  /** Price of building a brand-new multi-page site (plan + parallel page writers). */
  buildCredits: number;
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
    buildCredits: 4,
    // GPT-6 Luna: $0.10 / $0.50 per M tokens; GLM Flash and Haiku are fallbacks.
    models: fromEnv("MODELS_FAST", ["openai/gpt-6-luna", "z-ai/glm-5.3-flash", "anthropic/claude-haiku-5.5"]),
    maxTokens: 32_000,
    reasoning: null,
  },
  standard: {
    id: "standard",
    label: "Standard",
    blurb: "Best for new sites and redesigns",
    credits: 4,
    buildCredits: 15,
    // Grok 4.7: $2 / $6 per M tokens; Sonnet is the fallback.
    models: fromEnv("MODELS_STANDARD", ["x-ai/grok-4.7", "anthropic/claude-sonnet-5.5"]),
    maxTokens: 40_000,
    reasoning: "low",
  },
  max: {
    id: "max",
    label: "Max",
    blurb: "Most capable, for complex multi-page builds",
    credits: 10,
    buildCredits: 35,
    // GPT-6.1 Sol: $2 / $10 per M tokens; keep Grok as a lower-cost fallback.
    models: fromEnv("MODELS_MAX", ["openai/gpt-6.1-sol", "x-ai/grok-4.7"]),
    maxTokens: 48_000,
    reasoning: "medium",
  },
};

/** Cheap model for background jobs: prompt enhancement, moderation, SEO metadata. */
export const UTILITY_MODELS = fromEnv("MODELS_UTILITY", ["qwen/qwen3.8-flash", "z-ai/glm-5.3-flash", "anthropic/claude-haiku-5.5"]);

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
