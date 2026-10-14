import { verifyUnsubscribe } from "@/lib/lifecycle";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Unsubscribe from lifecycle emails. Supports RFC 8058 one-click (mail clients POST to the
 * List-Unsubscribe URL) and the confirm button on /unsubscribe. Signed per user, no login needed.
 */
async function unsubscribe(req: Request) {
  const url = new URL(req.url);
  const u = url.searchParams.get("u") ?? "";
  const t = url.searchParams.get("t") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(u) || !verifyUnsubscribe(u, t)) return Response.json({ error: "Invalid link" }, { status: 400 });
  await supabaseAdmin().from("profiles").update({ marketing_emails: false }).eq("id", u);
  return Response.json({ ok: true });
}

export const POST = unsubscribe;
