import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { ensureStudentOnboarded } from "@/lib/onboard-student";

// Official Supabase + Next.js App Router pattern for magic-link
// confirmation: exchangeCodeForSession(code) against the PKCE code the
// default (unedited) Magic Link / Confirm signup email templates
// already produce — {{ .ConfirmationURL }} routes through Supabase's
// hosted verify endpoint, which redirects here with ?code= because our
// browser client (@supabase/ssr) always sends a PKCE code_challenge with
// signInWithOtp, regardless of template content. No template
// customization is required (Supabase's free tier no longer allows it
// without custom SMTP as of their June 2026 policy change).
//
// Known, Supabase-documented limitation of PKCE (not a bug): the code
// exchange must happen in the same browser/device that requested the
// link, since the code_verifier is a secret only that browser holds.
// When testing locally, open the confirmation email in the SAME browser
// window used for /login (e.g. a new tab in the same Chrome window),
// not a different browser or a separate mail app.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      await ensureStudentOnboarded(data.user.id, data.user.email ?? null);
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("Failed to exchange auth code for session:", error?.message);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        error?.message ??
          "Could not complete login. This usually means the link was opened in a different browser than the one used to request it — PKCE requires the same browser/device. Request a new link and open it in that same browser."
      )}`
    );
  }

  console.error(
    `Auth callback hit with no code param (full query: ${searchParams.toString()})`
  );
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(
      "That login link had no code — it may have expired or already been used. Please request a new one."
    )}`
  );
}
