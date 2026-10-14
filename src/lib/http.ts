import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { appHost } from "@/config/site";
import { getSessionUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Project } from "@/lib/types";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

export function errorResponse(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
  }
  if (err instanceof ZodError) {
    return NextResponse.json({ error: err.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  console.error(err);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/** Wraps a route handler with consistent error responses. */
export function api<C>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

/**
 * Defense in depth against CSRF on cookie-authenticated mutations
 * (Supabase cookies are already SameSite=Lax).
 */
export function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return;
  const host = new URL(origin).host;
  const reqHost = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host !== appHost() && host !== reqHost) throw new ApiError(403, "Cross-origin request blocked");
}

export async function requireApiUser(req?: Request) {
  if (req && req.method !== "GET") assertSameOrigin(req);
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, "Please sign in.");
  return user;
}

export async function getOwnedProject<T = Project>(projectId: string, userId: string, columns = "*") {
  if (!/^[0-9a-f-]{36}$/i.test(projectId)) throw new ApiError(404, "Project not found");
  const { data, error } = await supabaseAdmin()
    .from("projects")
    .select(columns)
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new ApiError(404, "Project not found");
  return data as T;
}

export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const { data, error } = await supabaseAdmin().rpc("rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("rate_limit failed", error);
    return true; // fail open: never block real users because the limiter hiccupped
  }
  return data === true;
}

export function clientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
