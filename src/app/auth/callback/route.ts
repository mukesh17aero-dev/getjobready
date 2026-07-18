import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { ensureStudentOnboarded } from "@/lib/onboard-student";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    console.error("Auth callback hit with no code param");
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        "That login link is missing its code — it may have already been used or expired. Request a new one, or use the 6-digit code from the same email instead."
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
