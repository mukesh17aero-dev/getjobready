import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { ensureStudentOnboarded } from "@/lib/onboard-student";

// Called by the login page right after a successful one-time-code
// verification. verifyOtp() runs client-side and never hits
// /auth/callback, so onboarding has to be triggered here instead.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await ensureStudentOnboarded(user.id, user.email ?? null);
  return NextResponse.json({ ok: true });
}
