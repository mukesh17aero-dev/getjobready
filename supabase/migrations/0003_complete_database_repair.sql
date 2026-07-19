-- ============================================================
-- COMPLETE DATABASE REPAIR — Sessions 0-8 audit
-- Safe to run multiple times (idempotent). Supabase Free Tier
-- compatible — no paid features used anywhere in this script.
-- ============================================================
--
-- Confirmed root cause: employability_dimensions, target_roles, and
-- readiness_rules have RLS ENABLED with ZERO policies (confirmed
-- directly in Supabase Dashboard → Database → Policies: "No data will
-- be returned via the Data API as no RLS policies exist on this
-- table"). This silently returns an empty result to every
-- non-service-role query, no error — which is why the Session 8
-- dashboard renders no dimension cards despite unchanged, correct
-- application code.
--
-- This script does a full audit of all 12 tables from
-- supabase/schema.sql (Sessions 0-2) rather than just patching the
-- three known-broken ones, and folds in the soft-delete column from
-- migration 0001. It supersedes 0001 and 0002 — running this alone is
-- sufficient regardless of whether those were already applied.

-- ------------------------------------------------------------
-- 1. Soft-delete support (from migration 0001)
-- ------------------------------------------------------------
alter table students add column if not exists deleted_at timestamptz;

-- ------------------------------------------------------------
-- 2. Reference / config tables — must be PUBLICLY READABLE.
--    target_roles, employability_dimensions, readiness_rules are
--    read by the student dashboard and the assessment intake API
--    (via the service role, which is unaffected by RLS either way).
--    Writes are never performed by students in any built session —
--    only admin (future Session 11) via the service role — so no
--    insert/update policy is needed for these tables.
-- ------------------------------------------------------------
alter table target_roles enable row level security;
alter table employability_dimensions enable row level security;
alter table readiness_rules enable row level security;

drop policy if exists "target_roles_public_read" on target_roles;
create policy "target_roles_public_read" on target_roles
  for select using (true);

drop policy if exists "dimensions_public_read" on employability_dimensions;
create policy "dimensions_public_read" on employability_dimensions
  for select using (true);

drop policy if exists "readiness_rules_public_read" on readiness_rules;
create policy "readiness_rules_public_read" on readiness_rules
  for select using (true);

-- ------------------------------------------------------------
-- 3. students — RLS was enabled in the original schema.sql but NO
--    policy was ever created for it (a latent gap since Session 2;
--    not previously observed because all reads of this table go
--    through the service role — flagged now as part of this audit).
--    A student must be able to read their own row for any future
--    "my profile" style page.
-- ------------------------------------------------------------
alter table students enable row level security;

drop policy if exists "students_read_own_row" on students;
create policy "students_read_own_row" on students
  for select using (auth.uid() = student_id);

-- ------------------------------------------------------------
-- 4. Per-student data tables — RLS + "read own rows only" policies.
--    These already existed correctly in schema.sql; recreated here
--    idempotently (drop-if-exists + create) so this script is a
--    complete, standalone source of truth. No insert/update policies:
--    all writes to these tables happen server-side via the service
--    role (POST /api/assessments, onboarding) per the architecture —
--    students are read-only through RLS by design.
-- ------------------------------------------------------------
alter table student_employability_profiles enable row level security;
drop policy if exists "students_read_own" on student_employability_profiles;
create policy "students_read_own" on student_employability_profiles
  for select using (auth.uid() = student_id);

alter table student_dimension_statuses enable row level security;
drop policy if exists "students_read_own_dims" on student_dimension_statuses;
create policy "students_read_own_dims" on student_dimension_statuses
  for select using (auth.uid() = student_id);

alter table assessment_results enable row level security;
drop policy if exists "students_read_own_assessments" on assessment_results;
create policy "students_read_own_assessments" on assessment_results
  for select using (auth.uid() = student_id);

alter table evidence_records enable row level security;
drop policy if exists "students_read_own_evidence" on evidence_records;
create policy "students_read_own_evidence" on evidence_records
  for select using (auth.uid() = student_id);

alter table recommendations enable row level security;
drop policy if exists "students_read_own_recs" on recommendations;
create policy "students_read_own_recs" on recommendations
  for select using (auth.uid() = student_id);

-- passport_snapshots: students manage (not just read) their own
-- passport — matches the original schema.sql intent ahead of the
-- publish/revoke flow built in a later session.
alter table passport_snapshots enable row level security;
drop policy if exists "students_manage_own_passport" on passport_snapshots;
create policy "students_manage_own_passport" on passport_snapshots
  for all using (auth.uid() = student_id);

-- ------------------------------------------------------------
-- 5. readiness_events and audit_log — these had NO RLS at all in the
--    original schema.sql (a real gap: wide open to any anon/
--    authenticated request). Confirmed via grep that every read and
--    write in the app goes through the service role only (POST
--    /api/assessments for readiness_events; status-change logging for
--    audit_log) — no student-facing policy is added, which correctly
--    locks both tables down to service-role-only access. This is the
--    intentional, secure state for an internal event log and an audit
--    trail that must never be edited or read by the entities it
--    describes.
-- ------------------------------------------------------------
alter table readiness_events enable row level security;
alter table audit_log enable row level security;

-- ------------------------------------------------------------
-- 6. Seed / reference data — idempotent (only inserts if missing).
--    Verified via the service-role client that this data is currently
--    intact (1 target role, 5 dimensions, 5 rules), so these guards
--    are expected to be no-ops on this database — included so this
--    script is a complete, standalone repair tool regardless of that.
-- ------------------------------------------------------------
insert into target_roles (name, description)
select 'Retail Store Associate', 'Frontline retail role — MVP target'
where not exists (
  select 1 from target_roles where name = 'Retail Store Associate'
);

insert into employability_dimensions (name, category, weight)
select v.name, v.category, v.weight
from (values
  ('Communication', 'soft_skill', 1.5),
  ('Digital Skills', 'digital', 1.0),
  ('Interview Readiness', 'soft_skill', 1.5),
  ('Workplace Behaviour', 'soft_skill', 1.0),
  ('Professional Profile', 'profile', 0.5)
) as v(name, category, weight)
where not exists (
  select 1 from employability_dimensions e where e.name = v.name
);

insert into readiness_rules (
  dimension_id, target_role_id, threshold, strong_threshold,
  min_evidence_count, evidence_validity_days
)
select d.dimension_id, r.role_id, 70, 85, 2, 90
from employability_dimensions d
cross join target_roles r
where not exists (
  select 1 from readiness_rules rr
  where rr.dimension_id = d.dimension_id and rr.target_role_id = r.role_id
);
