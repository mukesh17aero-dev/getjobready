import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Session refresh (Next 16 proxy — the renamed middleware convention).
//
// Refreshing means a network round trip to Supabase, and this runs on every
// navigation *and* every link prefetch. So we only pay for it when the token
// is actually near expiry: the expiry is inside the JWT, which we can read
// locally without calling anyone.
const REFRESH_WINDOW_SECONDS = 120;

function decodeExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(
      Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(),
    ) as { exp?: number };
    return typeof json.exp === "number" ? json.exp : null;
  } catch {
    return null;
  }
}

// The session cookie is JSON (optionally base64- prefixed) and may be split
// across numbered chunks by @supabase/ssr.
function accessTokenFrom(request: NextRequest): string | null {
  const parts = request.cookies
    .getAll()
    .filter((c) => /^sb-.*-auth-token(\.\d+)?$/.test(c.name))
    .sort((a, b) => a.name.localeCompare(b.name));
  if (parts.length === 0) return null;
  let raw = parts.map((c) => c.value).join("");
  if (raw.startsWith("base64-")) {
    try {
      raw = Buffer.from(raw.slice("base64-".length), "base64").toString();
    } catch {
      return null;
    }
  }
  try {
    const session = JSON.parse(raw) as { access_token?: string };
    return session.access_token ?? null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const token = accessTokenFrom(request);
  if (token) {
    const exp = decodeExpiry(token);
    const secondsLeft = exp ? exp - Math.floor(Date.now() / 1000) : 0;
    // Comfortably valid: nothing to do, and no network call.
    if (secondsLeft > REFRESH_WINDOW_SECONDS) return response;
  } else {
    // No session cookie at all: nothing to refresh.
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Expired or about to expire: this refreshes and rewrites the cookies.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Everything except static assets — auth state can matter on any page.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
