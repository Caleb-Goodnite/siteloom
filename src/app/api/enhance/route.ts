import { z } from "zod";
import { UTILITY_MODELS } from "@/config/models";
import { complete } from "@/lib/ai/openrouter";
import { ENHANCE_PROMPT } from "@/lib/ai/prompts";
import { api, ApiError, rateLimit, requireApiUser } from "@/lib/http";
import { supabaseAdmin } from "@/lib/supabase/admin";

const Body = z.object({ prompt: z.string().trim().min(3).max(4000) });

/** Free: turns a vague request into a specific brief, so the first (paid) generation lands. */
export const POST = api(async (req) => {
  const user = await requireApiUser(req);
  const { prompt } = Body.parse(await req.json());
  if (!(await rateLimit(`enhance:${user.id}`, 20, 3600))) throw new ApiError(429, "You've enhanced a lot of prompts this hour. Try again soon.");
  const { text, usage } = await complete({
    models: UTILITY_MODELS,
    maxTokens: 500,
    temperature: 0.5,
    messages: [
      { role: "system", content: ENHANCE_PROMPT },
      { role: "user", content: prompt },
    ],
  });
  if (usage?.costUsd) await supabaseAdmin().rpc("record_ai_spend", { p_cost: usage.costUsd });
  return Response.json({ prompt: text.trim() });
});
