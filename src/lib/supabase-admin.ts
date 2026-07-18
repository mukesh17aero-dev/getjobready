// Server-only Supabase client using the service role key.
// This key bypasses Row Level Security — NEVER import this file into a
// client component. Only use it inside API routes, server actions, and
// standalone scripts (all of which run server-side).
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable"
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
