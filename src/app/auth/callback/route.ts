import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  // First-login onboarding: create the student's profile row if it
  // doesn't exist yet. All writes here use the service-role client —
  // students only ever read their own rows via RLS.
  const { data: existingStudent } = await supabaseAdmin
    .from("students")
    .select("student_id")
    .eq("student_id", data.user.id)
    .maybeSingle();

  if (!existingStudent) {
    await supabaseAdmin.from("students").insert({
      student_id: data.user.id,
      full_name: data.user.email ?? null,
    });

    const { data: targetRole } = await supabaseAdmin
      .from("target_roles")
      .select("role_id")
      .eq("active", true)
      .limit(1)
      .single();

    if (targetRole) {
      await supabaseAdmin.from("student_employability_profiles").insert({
        student_id: data.user.id,
        target_role_id: (targetRole as { role_id: string }).role_id,
      });
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
