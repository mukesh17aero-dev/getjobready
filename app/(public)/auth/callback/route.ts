import { NextResponse, type NextRequest } from "next/server";
import { completeCodeExchange, postSignInRoute } from "@/modules/identity";

/**
 * Where every link-based return lands: Google sign-in, the sign-up confirmation
 * email and the password-reset email all come back here with a one-time code.
 *
 * A route handler rather than a page because there is nothing to render — the
 * only outcomes are a redirect somewhere useful or a redirect back to /login
 * with a reason.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const code = searchParams.get("code");
  const next = searchParams.get("next");

  // Supabase reports a refused or cancelled sign-in this way — the person
  // clicked "Cancel" on Google's screen, or the provider is misconfigured.
  const providerError =
    searchParams.get("error_description") ?? searchParams.get("error");

  if (providerError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(providerError)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        "That sign-in link was incomplete. Please try again."
      )}`
    );
  }

  const result = await completeCodeExchange(code);

  if (!result.ok) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(result.error)}`
    );
  }

  if (!("user" in result)) {
    return NextResponse.redirect(`${origin}/login`);
  }

  return NextResponse.redirect(
    `${origin}${postSignInRoute(result.user.role, next)}`
  );
}
