import type { NextConfig } from "next";

const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "").hostname;
  } catch {
    return undefined;
  }
})();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Native/IO-heavy packages used by the publish pipeline stay in node_modules at runtime.
  serverExternalPackages: ["lightningcss", "tailwindcss", "sharp"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Publishing, export, domain verification, billing webhooks and cron all rebuild sites, which
  // compiles Tailwind on the server — so its stylesheet sources must ship with every API function.
  outputFileTracingIncludes: {
    "/api/**": ["./node_modules/tailwindcss/*.css"],
  },
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default nextConfig;
