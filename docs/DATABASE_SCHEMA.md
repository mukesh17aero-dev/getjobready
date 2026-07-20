# DATABASE_SCHEMA.md

Reference for all 12 tables, their RLS state, and the migration history. Source files: `supabase/schema.sql` (original), `supabase/seed.sql`, `supabase/migrations/*.sql` (sequential, apply in order via the Supabase SQL Editor — no CLI access exists for this project).

Last verified against the live database: 2026-07-20 (Session 8 stabilization).

---

## Tables

| Table | Purpose | RLS | Policy |
|---|---|---|---|
| `target_roles` | Reference: job roles the platform assesses against (MVP: 1 row, "Retail Store Associate") | ✅ | `for select using (true)` — public read; writes via service role only |
| `employability_dimensions` | Reference: the 5 scored dimensions (Communication, Digital Skills, Interview Readiness, Workplace Behaviour, Professional Profile) | ✅ | `for select using (true)` — public read |
| `readiness_rules` | Reference: threshold/strong_threshold/min_evidence_count/validity_days per dimension+role, versioned (insert-only, never `UPDATE`) | ✅ | `for select using (true)` — public read |
| `students` | 1 row per `auth.users`, extends the auth user with `full_name`, `phone`, `cohort`, `deleted_at` | ✅ | `for select using (auth.uid() = student_id)` |
| `student_employability_profiles` | 1 row per student per target role — `overall_status`, `pri_score`, `passport_eligible` | ✅ | `for select using (auth.uid() = student_id)` |
| `student_dimension_statuses` | 1 row per student per dimension — the dashboard's primary read | ✅ | `for select using (auth.uid() = student_id)` |
| `assessment_results` | Every assessment a student completes — `raw_score`, `normalized_score` (generated column), `ai_feedback`, `ai_prompt_version` | ✅ | `for select using (auth.uid() = student_id)` |
| `evidence_records` | Auto-created per assessment — the auditable evidence trail | ✅ | `for select using (auth.uid() = student_id)` |
| `readiness_events` | Internal event log (`assessment_completed`, `evidence_created`, `readiness_updated`) | ✅ | **none** — service-role-only by design |
| `passport_snapshots` | Frozen readiness snapshots for the future passport feature (Session 14+) | ✅ | `for all using (auth.uid() = student_id)` |
| `audit_log` | Before/after state on every status change | ✅ | **none** — service-role-only by design |
| `recommendations` | Next-best-action suggestions, generated from AI `improvement_action` when a dimension is `developing` | ✅ | `for select using (auth.uid() = student_id)` |

**No table in this schema has an insert/update RLS policy for students.** Every write goes through `supabaseAdmin` (the service role client) from trusted server-side code — `src/app/api/assessments/route.ts` and `src/lib/onboard-student.ts` are the only two write paths in the current codebase.

## Foreign Keys and Deletion Behavior

`students.student_id references auth.users(id)` — **no `ON DELETE` clause** (Postgres default: `NO ACTION`). Every table that references `students` does the same. This is deliberate, not an oversight: `ON DELETE CASCADE` would let a single Supabase Dashboard "delete user" click silently destroy a student's entire evidence and audit trail, which directly violates the evidence-first/audit-everything architecture (`CLAUDE.md`). Consequences:

- **You cannot delete a student with any assessment/evidence data via the Supabase Dashboard.** It will fail with "Database error deleting user." This is correct, intentional behavior.
- **For dev/test cleanup**, use `npx tsx scripts/delete-test-student.ts <uuid>` — it deletes all 7 dependent tables in the correct order, then `students`, then the `auth.users` row. It deliberately leaves `audit_log` untouched (no FK forces it, and an audit trail is meant to outlive the entities it describes).
- **For a real "delete my account" feature** (not yet built), the correct approach is `students.deleted_at` (added in migration 0001) — set it, don't hard-delete.

## Migration History

| File | What it does | Status |
|---|---|---|
| `schema.sql` | Original 12-table schema + initial RLS (Session 2). **Note:** as originally written, `students`, `readiness_events`, and `audit_log` had RLS gaps (see below) — not caught until Session 8. | Applied |
| `seed.sql` | 1 target role, 5 dimensions, 5 rules | Applied |
| `migrations/0001_students_soft_delete.sql` | Adds `students.deleted_at timestamptz` | Applied |
| `migrations/0002_reference_tables_public_read.sql` | Adds public-read policies to `target_roles`/`employability_dimensions`/`readiness_rules` after they were found with RLS-enabled-zero-policies | Superseded by 0003 |
| `migrations/0003_complete_database_repair.sql` | **The complete, idempotent, standalone repair.** Re-applies 0001, re-applies the three reference-table policies, **adds the previously-missing `students` self-read policy**, re-asserts every per-student policy idempotently, **enables RLS on `readiness_events` and `audit_log`** (neither had it before — a real gap, not previously observed because nothing reads them except the service role), and idempotently re-seeds reference data if missing. | Applied — this is the current source of truth for RLS state |

**Audit findings folded into 0003** (i.e., bugs found and fixed that were never previously reported as broken):
- `students` had RLS enabled since Session 2 with **no policy at all** — undetected because no code path reads it via RLS yet.
- `readiness_events` and `audit_log` had **no RLS enabled at all** — wide open to any authenticated/anon request. Locked down with zero student-facing policies (correct: these are internal/audit tables, never meant to be student-readable).

If a future migration is needed, follow the numbering convention (`0004_...sql`) and make it idempotent — there is no migration-tracking mechanism, so any script may need to run against a database in an unknown intermediate state.

## Seed Data (current, verified)

- `target_roles`: 1 row — "Retail Store Associate"
- `employability_dimensions`: 5 rows — Communication (weight 1.5), Digital Skills (1.0), Interview Readiness (1.5), Workplace Behaviour (1.0), Professional Profile (0.5)
- `readiness_rules`: 5 rows — one per dimension, threshold 70 / strong_threshold 85 / min_evidence_count 2 / evidence_validity_days 90 (version 1, active)

Verify at any time with `npx tsx scripts/verify-db.ts`.
