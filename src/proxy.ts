import { NextResponse, type NextRequest } from "next/server";
import { normalizeSitesDomain } from "@/config/site";
import { updateSession } from "@/lib/supabase/proxy";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const SITES_DOMAIN = normalizeSitesDomain(process.env.NEXT_PUBLIC_SITES_DOMAIN);
const appHost = new URL(APP_URL).host.toLowerCase();

const PROTECTED = ["/dashboard", "/project", "/admin"];
const SESSION_PATHS = [...PROTECTED, "/api", "/auth", "/login", "/signup"];

/**
 * Hosts that serve the product itself. Everything else is a customer site:
 * `slug.<SITES_DOMAIN>` or a connected custom domain.
 */
function isAppHost(host: string) {
  const h = host.toLowerCase();
  if (h === appHost || h === `www.${appHost}`) return true;
  if (h.endsWith(".vercel.app")) return true; // preview + production deployment URLs
  if (h === SITES_DOMAIN) return true; // bare sites domain → app
  if (/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(h)) return true;
  return false;
}

export async function proxy(request: NextRequest) {
  // Use the real Host header (not a client-settable forwarding header) to pick app vs. site.
  const host = (request.headers.get("host") ?? "").toLowerCase();
  const { pathname, search } = request.nextUrl;

  // The bare sites domain (e.g. curblit.site) must never serve the app: send visitors there.
  if (host === SITES_DOMAIN && SITES_DOMAIN !== appHost) {
    return NextResponse.redirect(new URL(pathname + search, APP_URL), 308);
  }

  // Customer sites: rewrite everything to the hosted-site handler.
  if (host && !isAppHost(host)) {
    const url = request.nextUrl.clone();
    url.pathname = `/hosted/${encodeURIComponent(host)}${pathname}`;
    url.search = search;
    return NextResponse.rewrite(url);
  }

  // The hosted handler must never serve customer HTML on the app's own origin.
  if (pathname.startsWith("/hosted")) {
    return new NextResponse("Not found", { status: 404 });
  }

  let response = NextResponse.next({ request });
  let userId: string | null = null;
  if (SESSION_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    ({ response, userId } = await updateSession(request));
    if (!userId && PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      const login = request.nextUrl.clone();
      login.pathname = "/login";
      login.search = `?next=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(login);
    }
    // Already signed in: skip the login/signup forms and go where they were headed.
    if (userId && (pathname === "/login" || pathname === "/signup")) {
      const next = request.nextUrl.searchParams.get("next") ?? "";
      let target = new URL("/dashboard", request.url);
      if (/^\/(?![/\\])/.test(next)) {
        const candidate = new URL(next, request.url);
        const loops = candidate.pathname === "/login" || candidate.pathname === "/signup";
        if (candidate.origin === target.origin && !loops) target = candidate; // never redirect off-site
      }
      const redirect = NextResponse.redirect(target);
      response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
      return redirect;
    }
  }

  // Referral links (?ref=code) are remembered for 60 days and credited at signup.
  const ref = request.nextUrl.searchParams.get("ref");
  if (ref && /^[a-z0-9]{6,12}$/i.test(ref) && !request.cookies.get("sl_ref")) {
    response.cookies.set("sl_ref", ref.toLowerCase(), { maxAge: 60 * 60 * 24 * 60, path: "/", sameSite: "lax" });
  }

  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
