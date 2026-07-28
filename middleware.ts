import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { requireEnv } from "@/lib/env";

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseAnonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

// Two jobs, and deliberately no more:
//
//   1. Refresh the Supabase session cookie so Server Components never see a
//      stale session.
//   2. Bounce someone with no session at all to /login, remembering where they
//      were going.
//
// It does NOT decide which role may open which area. That rule lives in
// `modules/identity` and is applied by the layout of each route group, which
// can read the database safely. Middleware cannot: it would have to import the
// service-role client into the edge bundle, and the role check needs a query
// this layer should never make.
//
// The practical effect is that an admin who opens /dashboard is redirected by
// the layout, server-side, before any student content is rendered. Nothing
// leaks; the check simply happens one layer in.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    // Only the path, never the full URL: a `next` that could carry another
    // origin would make this an open redirect.
    loginUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

// The signed-in areas. Adding a role area means adding it here and giving its
// route group a layout that calls `authorizeRole`.
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/portal/:path*"],
};
