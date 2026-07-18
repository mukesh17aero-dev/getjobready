// Deletes a test student and every row that has a foreign key pointing
// at them, then the underlying auth.users row — in the order required
// to avoid FK violations (see supabase/migrations/0001_students_soft_delete.sql
// for why we don't just add ON DELETE CASCADE).
//
// Dev/test use only. Never run this against a student with real
// evidence/audit history you want to keep — in production, set
// students.deleted_at instead of hard-deleting.
//
// audit_log is deliberately left untouched: it has no foreign key back
// to students and is meant to survive the entities it describes.
//
// Run with: npx tsx scripts/delete-test-student.ts <student-uuid>

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

const studentId = process.argv[2];
if (!studentId) {
  console.error("Usage: npx tsx scripts/delete-test-student.ts <student-uuid>");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const CHILD_TABLES = [
  "student_employability_profiles",
  "student_dimension_statuses",
  "assessment_results",
  "evidence_records",
  "readiness_events",
  "passport_snapshots",
  "recommendations",
] as const;

async function main() {
  for (const table of CHILD_TABLES) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("student_id", studentId);

    if (error) {
      console.error(`Failed to delete from ${table}: ${error.message}`);
      process.exit(1);
    }
    console.log(`Cleared ${table}`);
  }

  const { error: studentError } = await supabase
    .from("students")
    .delete()
    .eq("student_id", studentId);

  if (studentError) {
    console.error(`Failed to delete students row: ${studentError.message}`);
    process.exit(1);
  }
  console.log("Cleared students row");

  const { error: authError } = await supabase.auth.admin.deleteUser(studentId);

  if (authError) {
    console.error(`Failed to delete auth user: ${authError.message}`);
    process.exit(1);
  }
  console.log(`Deleted auth user ${studentId}`);
}

main();
