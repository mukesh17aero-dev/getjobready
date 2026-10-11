import type { NextConfig } from "next";

// Development only. Everything the backend serves lives under /v1, and this
// repo owns no route by that name, so one rule covers the whole API.
//
// Without it the app cannot be exercised on a real phone: the browser bundle
// is built with the developer's own NEXT_PUBLIC_API_URL, and "localhost:8080"
// on a phone means the phone. Pointing it at the Mac's LAN address instead
// trades that for a CORS rejection, and once the page is served over HTTPS to
// test home-screen install, for a blocked mixed-content request as well.
// Same-origin requests avoid all three.
//
// Production returns no rules at all: the deployed frontend calls Render
// directly, and Vercel never sits in the path of application data.
const nextConfig: NextConfig = {
  // Next.js blocks a phone on the LAN from loading /_next/* dev resources
  // unless the host is named here. The symptom is deceptive: pages still
  // render, because that happens on the dev machine, but the browser bundle
  // never wires up - so every button is dead and every backend call the client
  // was meant to make simply never happens. It reads as "the backend is down".
  // Development only; Next ignores this in a production build.
  allowedDevOrigins: [
    "daniels-macbook-air.local",
    "Daniels-MacBook-Air.local",
    "192.168.4.26",
  ],
  // Assessment scene pictures live in Supabase Storage's public buckets.
  // next/image refuses any host not named here, so without this every
  // pictured question showed a broken image. Public objects only.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  // The nav labels this section "Identity" and the route is /resume, so
  // typing what the bar says landed on a 404. Temporary, not permanent: a
  // browser caches a 308 indefinitely, which would pin this mapping even if
  // the route is later renamed to match the label.
  async redirects() {
    return [{ source: "/identity", destination: "/resume", permanent: false }];
  },
  async rewrites() {
    if (process.env.NODE_ENV !== "development") return [];
    const target = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
    return [{ source: "/v1/:path*", destination: `${target}/v1/:path*` }];
  },
};

export default nextConfig;
