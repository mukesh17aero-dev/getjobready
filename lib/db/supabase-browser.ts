"use client";

import { createBrowserClient } from "@supabase/ssr";

// NEXT_PUBLIC_* vars must be read via a literal `process.env.X` access (not
// the dynamic `process.env[name]` pattern `requireEnv()` uses) — Next.js can
// only statically inline env vars into the browser bundle when the property
// access is analyzable at build time. A computed key silently ships as
// `undefined` to the client, which throws at module-load time in the browser
// (invisible in server logs) even though the server-rendered HTML is fine.
function mustPublicEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
}

const supabaseUrl = mustPublicEnv(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  "NEXT_PUBLIC_SUPABASE_URL"
);
const supabaseAnonKey = mustPublicEnv(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
);

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
