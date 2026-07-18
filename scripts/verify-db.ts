// Prints every Employability Framework table with its row count.
// Run with: npx tsx scripts/verify-db.ts
// Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.

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

const TABLES = [
  "target_roles",
  "employability_dimensions",
  "readiness_rules",
  "students",
  "student_employability_profiles",
  "student_dimension_statuses",
  "assessment_results",
  "evidence_records",
  "readiness_events",
  "passport_snapshots",
  "audit_log",
  "recommendations",
] as const;

async function main() {
  for (const table of TABLES) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error(`${table}: ERROR - ${error.message}`);
      continue;
    }

    console.log(`${table}: ${count} rows`);
  }
}

main();
