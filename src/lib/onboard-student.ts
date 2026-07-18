import { supabaseAdmin } from "@/lib/supabase-admin";

// Creates the students + student_employability_profiles rows on a
// student's first login. No-ops if the student already exists. Called
// from both the magic-link callback route and the one-time-code
// verification path, since either can complete a first login.
export async function ensureStudentOnboarded(
  studentId: string,
  email: string | null
): Promise<void> {
  const { data: existingStudent } = await supabaseAdmin
    .from("students")
    .select("student_id")
    .eq("student_id", studentId)
    .maybeSingle();

  if (existingStudent) {
    return;
  }

  await supabaseAdmin.from("students").insert({
    student_id: studentId,
    full_name: email ?? null,
  });

  const { data: targetRole } = await supabaseAdmin
    .from("target_roles")
    .select("role_id")
    .eq("active", true)
    .limit(1)
    .single();

  if (targetRole) {
    await supabaseAdmin.from("student_employability_profiles").insert({
      student_id: studentId,
      target_role_id: (targetRole as { role_id: string }).role_id,
    });
  }
}
