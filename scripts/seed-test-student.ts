// Seeds one fixed-UUID test student (with an auth.users row, since
// students.student_id has a foreign key to it) plus its employability
// profile, for local curl testing.
// Run with: npx tsx scripts/seed-test-student.ts

import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const TEST_STUDENT_ID = "11111111-1111-4111-8111-111111111111";
const TEST_STUDENT_EMAIL = "test-student@getjobready.local";

async function main() {
  const { data: existingAuthUser } = await supabase.auth.admin.getUserById(
    TEST_STUDENT_ID
  );

  if (!existingAuthUser?.user) {
    const { error: createUserError } = await supabase.auth.admin.createUser({
      id: TEST_STUDENT_ID,
      email: TEST_STUDENT_EMAIL,
      email_confirm: true,
    });

    if (createUserError) {
      console.error(`Failed to create auth user: ${createUserError.message}`);
      process.exit(1);
    }
  }

  const { error: studentError } = await supabase.from("students").upsert({
    student_id: TEST_STUDENT_ID,
    full_name: "Test Student",
    cohort: "pilot",
  });

  if (studentError) {
    console.error(`Failed to seed students row: ${studentError.message}`);
    process.exit(1);
  }

  const { data: targetRole, error: targetRoleError } = await supabase
    .from("target_roles")
    .select("role_id")
    .eq("active", true)
    .limit(1)
    .single();

  if (targetRoleError || !targetRole) {
    console.error(
      "No active target role found. Run supabase/schema.sql and supabase/seed.sql first."
    );
    process.exit(1);
  }

  const { error: profileError } = await supabase
    .from("student_employability_profiles")
    .upsert(
      {
        student_id: TEST_STUDENT_ID,
        target_role_id: (targetRole as { role_id: string }).role_id,
      },
      { onConflict: "student_id,target_role_id" }
    );

  if (profileError) {
    console.error(`Failed to seed profile row: ${profileError.message}`);
    process.exit(1);
  }

  console.log(`Test student created: ${TEST_STUDENT_ID}`);
}

main();
