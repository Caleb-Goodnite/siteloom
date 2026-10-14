import "server-only";
import { site } from "@/config/site";
import { serverEnv } from "@/lib/env";

const BASE = "https://openrouter.ai/api/v1";

export type ContentPart =
  | { type: "text"; text: string; cache_control?: { type: "ephemeral" } }
  | { type: "image_url"; image_url: { url: string } };

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
};

export type Usage = {
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  costUsd: number;
};

export type StreamEvent =
  | { type: "text"; text: string }
  | { type: "reasoning" }
  | { type: "model"; model: string }
  | { type: "finish"; reason: string }
  | { type: "usage"; usage: Usage };

function headers() {
  return {
    Authorization: `Bearer ${serverEnv.openrouterKey}`,
    "Content-Type": "application/json",
    // App attribution: shows up in OpenRouter's public app rankings (free distribution).
    "HTTP-Referer": site.url,
    "X-Title": site.name,
  };
}

function modelFields(models: string[]) {
  return models.length > 1 ? { model: models[0], models } : { model: models[0] };
}

function parseUsage(u: Record<string, unknown> | undefined): Usage | null {
  if (!u) return null;
  const details = (u.prompt_tokens_details ?? {}) as Record<string, number>;
  return {
    inputTokens: Number(u.prompt_tokens ?? 0),
    outputTokens: Number(u.completion_tokens ?? 0),
    cachedTokens: Number(details.cached_tokens ?? 0),
    costUsd: Number(u.cost ?? 0),
  };
}

export class OpenRouterError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}

/** Streams a chat completion, yielding text deltas, the model used and final usage. */
export async function* streamChat(opts: {
  models: string[];
  messages: ChatMessage[];
  maxTokens: number;
  reasoning?: "low" | "medium" | null;
  userId?: string;
  signal?: AbortSignal;
}): AsyncGenerator<StreamEvent> {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: headers(),
    signal: opts.signal,
    body: JSON.stringify({
      ...modelFields(opts.models),
      messages: opts.messages,
      stream: true,
      max_tokens: opts.maxTokens,
      temperature: 0.4,
      ...(opts.reasoning ? { reasoning: { effort: opts.reasoning, exclude: true } } : {}),
      user: opts.userId,
    }),
  });

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    throw new OpenRouterError(`OpenRouter ${res.status}: ${body.slice(0, 300)}`, res.status);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let announcedModel = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let nl: number;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line.startsWith("data:")) continue; // comments like ": OPENROUTER PROCESSING"
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") return;

      let chunk: Record<string, unknown>;
      try {
        chunk = JSON.parse(payload);
      } catch {
        continue;
      }
      if (chunk.error) {
        const e = chunk.error as { message?: string; code?: number };
        throw new OpenRouterError(e.message ?? "Model error", e.code);
      }
      if (!announcedModel && typeof chunk.model === "string") {
        announcedModel = true;
        yield { type: "model", model: chunk.model };
      }
      const choice = (chunk.choices as Array<Record<string, unknown>> | undefined)?.[0];
      const delta = choice?.delta as Record<string, unknown> | undefined;
      if (delta) {
        if (typeof delta.content === "string" && delta.content) yield { type: "text", text: delta.content };
        if (delta.reasoning || delta.reasoning_details) yield { type: "reasoning" };
      }
      if (choice?.finish_reason === "error") throw new OpenRouterError("The model stopped with an error");
      if (typeof choice?.finish_reason === "string") yield { type: "finish", reason: choice.finish_reason };
      const usage = parseUsage(chunk.usage as Record<string, unknown> | undefined);
      if (usage) yield { type: "usage", usage };
    }
  }
}

/** Non-streaming completion for small utility tasks. Optionally parses JSON output. */
export async function complete(opts: {
  models: string[];
  messages: ChatMessage[];
  maxTokens?: number;
  json?: boolean;
  temperature?: number;
  signal?: AbortSignal;
}): Promise<{ text: string; usage: Usage | null; model: string }> {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: headers(),
    signal: opts.signal ?? AbortSignal.timeout(60_000),
    body: JSON.stringify({
      ...modelFields(opts.models),
      messages: opts.messages,
      max_tokens: opts.maxTokens ?? 2000,
      temperature: opts.temperature ?? 0.3,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) throw new OpenRouterError(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 300)}`, res.status);
  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? "";
  return { text, usage: parseUsage(data.usage), model: data.model ?? opts.models[0] };
}

/** Extracts the first JSON object from a model response (tolerates code fences). */
export function parseJsonLoose<T>(text: string): T | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

/** Generates one image via OpenRouter's Images API, trying each model in order. */
export async function generateImage(opts: {
  models: string[];
  prompt: string;
  aspectRatio: string;
  userId?: string;
}): Promise<{ bytes: Uint8Array; mediaType: string; costUsd: number; model: string }> {
  let lastError: unknown;
  for (const model of opts.models) {
    try {
      const res = await fetch(`${BASE}/images`, {
        method: "POST",
        headers: headers(),
        signal: AbortSignal.timeout(90_000),
        body: JSON.stringify({
          model,
          prompt: opts.prompt,
          aspect_ratio: opts.aspectRatio,
          n: 1,
          user: opts.userId,
        }),
      });
      if (!res.ok) throw new OpenRouterError(`Images ${res.status}: ${(await res.text()).slice(0, 200)}`, res.status);
      const data = await res.json();
      const img = data.data?.[0];
      if (!img?.b64_json) throw new OpenRouterError("No image returned");
      return {
        bytes: Uint8Array.from(Buffer.from(img.b64_json, "base64")),
        mediaType: img.media_type ?? "image/png",
        costUsd: Number(data.usage?.cost ?? 0),
        model,
      };
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Image generation failed");
}
