import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { ensureStudentOnboarded } from "@/lib/onboard-student";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Supabase's own /auth/v1/verify endpoint redirects here with
  // error/error_code/error_description query params (not a code) when the
  // link itself was rejected — e.g. an expired or already-used token. Log
  // and surface these explicitly instead of masking them behind a generic
  // "no code" message.
  const supabaseError = searchParams.get("error_description") ?? searchParams.get("error");
  if (supabaseError) {
    console.error(
      `Supabase rejected the auth link before reaching our app: ${supabaseError} (full query: ${searchParams.toString()})`
    );
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(supabaseError)}`
    );
  }

  if (!code) {
    console.error(
      `Auth callback hit with no code param and no error param (full query: ${searchParams.toString()})`
    );
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        "That login link had no code and no error from Supabase — check the Supabase Dashboard's Redirect URLs configuration. Meanwhile, use the code from the same email instead."
      )}`
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("Failed to exchange auth code for session:", error?.message);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        error?.message ??
          "Could not complete login from that link. Try the 6-digit code from the same email instead."
      )}`
    );
  }

  await ensureStudentOnboarded(data.user.id, data.user.email ?? null);

  return NextResponse.redirect(`${origin}/dashboard`);
}
