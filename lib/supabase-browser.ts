import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Browser client for authentication only — anon key, RLS-bound. All data
// access goes through the backend API, never through this client.
let client: SupabaseClient | null = null;

export function supabaseBrowser(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set",
      );
    }
    client = createClient(url, key);
  }
  return client;
}
