-- ============================================
-- EMPLOYABILITY FRAMEWORK SCHEMA v1.0
-- ============================================

-- 1. TARGET ROLES (start with one: Retail Store Associate)
create table target_roles (
  role_id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  active boolean default true,
  created_at timestamptz default now()
);

-- 2. EMPLOYABILITY DIMENSIONS
create table employability_dimensions (
  dimension_id uuid primary key default gen_random_uuid(),
  name text not null,                    -- e.g., 'Communication'
  description text,
  category text,                         -- e.g., 'soft_skill', 'digital', 'domain'
  weight numeric not null default 1.0,   -- for PRI calculation
  active boolean default true,
  created_at timestamptz default now()
);

-- 3. READINESS RULES (thresholds live in DB, not code)
create table readiness_rules (
  rule_id uuid primary key default gen_random_uuid(),
  dimension_id uuid references employability_dimensions not null,
  target_role_id uuid references target_roles not null,
  threshold numeric not null default 70,        -- Meets Standard
  strong_threshold numeric not null default 85, -- Strong
  min_evidence_count int not null default 2,
  evidence_validity_days int not null default 90,
  version int not null default 1,
  active boolean default true,
  created_at timestamptz default now(),
  unique (dimension_id, target_role_id, version)
);

-- 4. STUDENTS (extends Supabase auth.users)
create table students (
  student_id uuid primary key references auth.users(id),
  full_name text,
  phone text,
  cohort text,
  created_at timestamptz default now()
);

-- 5. STUDENT EMPLOYABILITY PROFILE (one per student per role)
create table student_employability_profiles (
  profile_id uuid primary key default gen_random_uuid(),
  student_id uuid references students not null,
  target_role_id uuid references target_roles not null,
  overall_status text not null default 'not_assessed',
  pri_score int,                          -- 300-800, null until assessed
  passport_eligible boolean default false,
  last_assessed_at timestamptz,
  updated_at timestamptz default now(),
  unique (student_id, target_role_id)
);

-- 6. STUDENT DIMENSION STATUS
create table student_dimension_statuses (
  status_id uuid primary key default gen_random_uuid(),
  student_id uuid references students not null,
  dimension_id uuid references employability_dimensions not null,
  score numeric,                          -- latest normalized 0-100
  status text not null default 'not_assessed',
    -- 'not_assessed' | 'developing' | 'meets_standard' | 'strong' | 'outdated'
  evidence_count int default 0,
  rule_version_applied int,
  last_updated_at timestamptz default now(),
  unique (student_id, dimension_id)
);

-- 7. ASSESSMENT RESULTS
create table assessment_results (
  assessment_id uuid primary key default gen_random_uuid(),
  student_id uuid references students not null,
  dimension_id uuid references employability_dimensions not null,
  assessment_type text not null,
    -- 'mock_interview' | 'quiz' | 'written_task' | 'digital_task' | 'simulation'
  raw_score numeric not null,
  max_score numeric not null default 100,
  normalized_score numeric generated always as
    (round((raw_score / max_score) * 100, 1)) stored,
  passed boolean,
  submission_payload jsonb,               -- transcript, answers, task output
  ai_feedback jsonb,                      -- filled in by AI Evaluation Layer
  ai_prompt_version text,                 -- traceability requirement
  created_at timestamptz default now()
);

-- 8. EVIDENCE RECORDS (the heart of the system)
create table evidence_records (
  evidence_id uuid primary key default gen_random_uuid(),
  student_id uuid references students not null,
  dimension_id uuid references employability_dimensions not null,
  source_type text not null,              -- 'assessment' | 'manual' | 'external'
  source_id uuid,                         -- links to assessment_id
  evidence_summary text not null,         -- human-readable one-liner
  score numeric,
  verified boolean default true,          -- auto-verified if from assessment
  file_url text,                          -- Supabase Storage URL if artifact exists
  created_at timestamptz default now()
);

-- 9. READINESS EVENTS (poor man's message queue — this replaces Kafka/SQS)
create table readiness_events (
  event_id uuid primary key default gen_random_uuid(),
  student_id uuid references students not null,
  event_type text not null,
    -- 'assessment_completed' | 'evidence_created' | 'readiness_updated'
    -- | 'passport_eligibility_changed' | 'recommendation_required'
  payload jsonb not null default '{}',
  processed boolean default false,
  created_at timestamptz default now()
);
create index idx_events_unprocessed on readiness_events (processed, created_at)
  where processed = false;

-- 10. PASSPORT SNAPSHOTS
create table passport_snapshots (
  snapshot_id uuid primary key default gen_random_uuid(),
  student_id uuid references students not null,
  share_token text unique default encode(gen_random_bytes(16), 'hex'),
  snapshot_data jsonb not null,           -- frozen readiness view at publish time
  consent_given boolean default false,
  revoked boolean default false,
  published_at timestamptz default now()
);

-- 11. AUDIT LOG
create table audit_log (
  log_id uuid primary key default gen_random_uuid(),
  student_id uuid,
  actor text not null,                    -- 'system' | 'admin:<id>' | 'student:<id>'
  action text not null,                   -- 'status_change' | 'rule_change' | 'passport_publish' | 'passport_revoke' | 'consent_change'
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz default now()
);

-- 12. RECOMMENDATIONS
create table recommendations (
  rec_id uuid primary key default gen_random_uuid(),
  student_id uuid references students not null,
  dimension_id uuid references employability_dimensions,
  action_text text not null,              -- 'Complete the email-writing task'
  action_link text,                       -- deep link into the app
  priority int default 1,
  completed boolean default false,
  created_at timestamptz default now()
);

-- ============================================
-- ROW LEVEL SECURITY (critical — do not skip)
-- ============================================
alter table students enable row level security;
alter table student_employability_profiles enable row level security;
alter table student_dimension_statuses enable row level security;
alter table assessment_results enable row level security;
alter table evidence_records enable row level security;
alter table recommendations enable row level security;
alter table passport_snapshots enable row level security;

-- Students read their own data only
create policy "students_read_own" on student_employability_profiles
  for select using (auth.uid() = student_id);
create policy "students_read_own_dims" on student_dimension_statuses
  for select using (auth.uid() = student_id);
create policy "students_read_own_assessments" on assessment_results
  for select using (auth.uid() = student_id);
create policy "students_read_own_evidence" on evidence_records
  for select using (auth.uid() = student_id);
create policy "students_read_own_recs" on recommendations
  for select using (auth.uid() = student_id);
create policy "students_manage_own_passport" on passport_snapshots
  for all using (auth.uid() = student_id);

-- All WRITES happen server-side via the service role key (API routes),
-- so no insert/update policies for students are needed.
-- Admin tables (dimensions, rules, roles) are managed via service role only.
