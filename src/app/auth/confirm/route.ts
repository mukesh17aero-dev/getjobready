import type { EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { ensureStudentOnboarded } from "@/lib/onboard-student";

// Official Supabase Next.js App Router pattern for email-link
// confirmation: verifyOtp({ token_hash, type }) is a single, stateless
// server call — unlike exchangeCodeForSession(code), it never depends on
// a code_verifier the browser stored earlier. That's deliberate: a
// magic-link email can be opened in a different browser tab, profile, or
// after a mail client's link-prescanner already visited it, and this
// mechanism doesn't care either way.
//
// Requires the Magic Link / Confirm signup email templates in the
// Supabase Dashboard to link here with token_hash and type, e.g.:
// {{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  if (token_hash && type) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error && data.user) {
      await ensureStudentOnboarded(data.user.id, data.user.email ?? null);
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("Failed to verify OTP token_hash:", error?.message);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        error?.message ??
          "Could not complete login from that link. Try the code from the same email instead."
      )}`
    );
  }

  console.error(
    `Auth confirm hit with missing token_hash/type (full query: ${searchParams.toString()})`
  );
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(
      "That login link was missing required parameters. Try the code from the same email instead."
    )}`
  );
}
