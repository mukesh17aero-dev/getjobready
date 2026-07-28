// Server-only Supabase client using the service role key.
// This key bypasses Row Level Security — NEVER import this file into a
// client component. Only use it inside API routes, server actions, and
// standalone scripts (all of which run server-side).
import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
