import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";

let signedIn = false;
vi.mock("@/lib/supabase/proxy", () => ({
  updateSession: async (request: NextRequest) => ({ response: NextResponse.next({ request }), userId: signedIn ? "user-1" : null }),
}));

const { proxy } = await import("@/proxy");

async function go(path: string) {
  const res = await proxy(new NextRequest(`http://localhost:3000${path}`, { headers: { host: "localhost:3000" } }));
  return res.headers.get("location");
}

describe("auth redirects", () => {
  it("sends signed-in users from login/signup to the dashboard or their next page", async () => {
    signedIn = true;
    expect(await go("/signup")).toBe("http://localhost:3000/dashboard");
    expect(await go("/login?next=%2Fdashboard%2Fbilling%3Fplan%3Dpro")).toBe("http://localhost:3000/dashboard/billing?plan=pro");
    expect(await go("/login?next=%2F%2Fevil.com")).toBe("http://localhost:3000/dashboard");
    expect(await go("/login?next=%2F%5Cevil.com")).toBe("http://localhost:3000/dashboard");
    expect(await go("/signup?next=%2Flogin")).toBe("http://localhost:3000/dashboard");
  });

  it("shows the forms to signed-out visitors and protects the dashboard", async () => {
    signedIn = false;
    expect(await go("/signup")).toBeNull();
    expect(await go("/dashboard")).toBe("http://localhost:3000/login?next=%2Fdashboard");
  });
});

describe("sites domain setting", async () => {
  const { normalizeSitesDomain } = await import("@/config/site");
  it("accepts the common ways of typing it", () => {
    for (const v of ["siteloomsites.com", "*.siteloomsites.com", "https://siteloomsites.com/", " SiteloomSites.com ", "www.siteloomsites.com"]) {
      expect(normalizeSitesDomain(v)).toBe("siteloomsites.com");
    }
    expect(normalizeSitesDomain(undefined)).toBe("localhost:3000");
  });
});
