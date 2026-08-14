// Server-side session access for Server Components and route handlers.
// Reads the cookie-based Supabase session; refreshing expired sessions is
// proxy.ts's job (Server Components cannot write cookies).

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Session } from "@supabase/supabase-js";

function env(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY"): string {
  const value =
    name === "NEXT_PUBLIC_SUPABASE_URL"
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!value) throw new Error(`${name} must be set`);
  return value;
}

export async function getServerSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    env("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {
          // Server Components may not write cookies; proxy.ts refreshes.
        },
      },
    },
  );
  const { data } = await supabase.auth.getSession();
  return data.session;
}
