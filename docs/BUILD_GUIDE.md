# Employability Framework — Complete PRD + Technical Architecture + Build Guide

**Version 1.0 | Adapted from ASCEND-ENG-004 v0.2 | For solo AI-assisted build**
**Stack: Next.js 14 (App Router) + Supabase + Claude API + Vercel**

---

# PART 1 — PRODUCT REQUIREMENTS DOCUMENT (PRD)

## 1.1 What We Are Building (Plain English)

A system that answers one question with proof: **"Is this student ready for this job?"**

Today, platforms say "course completed = ready." That's not credible to employers. This framework says a student is ready only when the platform holds **auditable evidence** — real assessment results, real scores, real timestamps — for every readiness claim.

Think of it as a **credit score for employability (your PRI)**, but where every point on the score can be traced back to something the student actually did.

## 1.2 The Core Principle: Evidence-First

> The platform must NEVER claim a student is ready unless it stores evidence supporting that claim.

Every visible status (e.g., "Communication: Meets Standard") must be traceable to:
1. **An assessment** the student completed (interview, quiz, task, simulation)
2. **A rule** that was applied (e.g., "score ≥ 70 AND at least 2 evidence items")
3. **Evidence records** with timestamps and sources

## 1.3 Users & Personas

| Persona | Who | What they need |
|---|---|---|
| **Student** (primary) | Frontline job seeker / trainee, Tier-2/3 city, mobile-first | See my readiness per dimension, know exactly what to do next, get a shareable proof of readiness |
| **Admin** (you, initially) | Platform operator | Configure dimensions, thresholds, evidence rules; monitor cohorts |
| **Employer** (Phase 2) | Retail chain HR / hiring manager | View verified, student-approved readiness passports |

## 1.4 Core Concepts (Glossary)

| Term | Meaning |
|---|---|
| **Dimension** | A measurable readiness area. E.g., Communication, Digital Skills, Interview Readiness, Workplace Behaviour, Professional Profile |
| **Assessment** | A structured activity producing a score: mock interview, quiz, email-writing task, Excel task, role-play simulation |
| **Evidence** | An auditable record linking an assessment result to a dimension, with timestamp and verification status |
| **Readiness Status** | One of: Not Assessed → Developing → Meets Standard → Strong → Outdated |
| **Readiness Rules** | Deterministic (non-AI) rules that decide status: thresholds + minimum evidence counts + validity windows |
| **Passport** | The employer-facing, student-approved snapshot of verified readiness |
| **PRI** | Overall score (300–800) computed from weighted dimension scores — only counting dimensions with valid evidence |

## 1.5 The Golden Rule: AI vs. Rules

This is the most important product decision. **AI never decides status. Rules decide status.**

| Rules (deterministic TypeScript) decide | AI (Claude) generates |
|---|---|
| Pass/fail against thresholds | Feedback summaries after an interview |
| Whether evidence minimums are met | Strengths & gaps analysis |
| Passport eligibility | Student-friendly explanations ("here's why you're at Developing") |
| Score normalization (raw → 0–100) | Improvement suggestions |
| Status transitions (Developing → Meets Standard) | Workplace scenario qualitative evaluation (which then produces a raw score that RULES process) |

**Why:** Employers and auditors must be able to ask "why is this student marked ready?" and get an explainable answer. "The AI said so" is not acceptable. "Score 78 ≥ threshold 70, with 3 verified evidence items within 90 days" is.

## 1.6 Readiness Status Model

| Status | Meaning | Rule |
|---|---|---|
| **Not Assessed** | No valid evidence | evidence_count = 0 |
| **Developing** | Evidence exists, below standard | score < threshold OR evidence_count < minimum |
| **Meets Standard** | Ready for the role | score ≥ threshold AND evidence_count ≥ minimum AND evidence within validity window |
| **Strong** | Exceeds standard | score ≥ strong_threshold AND evidence_count ≥ minimum + 1 |
| **Outdated** | Was ready, evidence too old | newest evidence older than validity window (default: 90 days) |

## 1.7 Feature List (MVP Scope)

### Must Have (Phase 1–3)
1. **Admin: Dimension & Rules Config** — CRUD for dimensions (name, weight, thresholds, min evidence, validity days)
2. **Assessment Intake** — API endpoint that any module (interview engine, quiz, simulation) posts results to
3. **Evidence Store** — Every assessment automatically creates a linked evidence record
4. **Readiness Engine** — Recalculates dimension status + overall PRI whenever new evidence arrives
5. **AI Feedback Layer** — Claude generates qualitative feedback on assessment submissions (stored with prompt version)
6. **Student Dashboard** — Dimension cards with status, PRI dial, "next best action"
7. **Audit Log** — Every status change logged with before/after + triggering evidence

### Should Have (Phase 4)
8. **Passport Snapshot** — Internal shareable readiness view (link-based, student-controlled)
9. **Recommendations** — When a dimension is Developing, generate the specific next activity
10. **Cohort Dashboard** — Admin view of readiness distribution across a batch

### Won't Have (MVP)
- External employer portal with logins (pilot via shared links first)
- Microservices / message queues (modular monolith + event table instead)
- Multi-role thresholds (start with ONE target role, e.g., Retail Store Associate)

## 1.8 User Stories (Build Checklist)

**Student**
- As a student, I can see my overall PRI score and what it's made of
- As a student, I can see each dimension's status and why (which evidence, which scores)
- As a student, after completing an assessment I get AI feedback within 30 seconds
- As a student, I always see ONE clear "do this next" action
- As a student, I can generate a shareable passport link and revoke it anytime

**Admin**
- As an admin, I can add/edit dimensions with weight, threshold, strong threshold, min evidence, validity days
- As an admin, I can see the audit trail of any student's status changes
- As an admin, I can force a recalculation for a student or the whole cohort after changing rules

**System**
- When an assessment result arrives, the system stores it, creates evidence, runs AI feedback, recalculates readiness, and logs everything — automatically, in that order

## 1.9 Success Metrics

| Metric | Target (Pilot) |
|---|---|
| Assessment → status update latency | < 60 seconds end-to-end |
| % of readiness claims with traceable evidence | 100% (hard requirement) |
| Student weekly active (completing ≥1 assessment) | > 60% of cohort |
| Passport links generated per ready student | > 50% |
| AI feedback cost per assessment | < ₹2 (Haiku-first routing) |

## 1.10 Open Product Decisions (Answered for MVP)

The source architecture doc listed 6 open questions. Here are the recommended MVP answers:

| Question | MVP Decision | Why |
|---|---|---|
| Rules in DB or hardcoded? | **In DB** (readiness_rules table) | You'll tune thresholds constantly during pilot; no redeploys |
| Evidence as files or records? | **DB records with JSONB payload**; file URLs in Supabase Storage only when there's an actual artifact (e.g., audio) | Simplest, auditable, cheap |
| Store AI feedback verbatim? | **Yes, verbatim + prompt_version** | Needed for traceability; add privacy scrubbing later |
| Evidence validity period? | **90 days** default, configurable per dimension | Standard skill-recency window |
| Employer sharing in MVP? | **Pilot only, via revocable share links** | Zero employer onboarding friction |
| Human review level? | **Admin spot-check queue** for first 100 passports | Builds trust cheaply |

---

# PART 2 — TECHNICAL ARCHITECTURE

## 2.1 Architecture Style: Modular Monolith on Your Existing Stack

The source doc describes 9 "services." **You should NOT build 9 services.** For a solo builder, each "service" becomes a **folder of TypeScript functions** inside one Next.js app. Same boundaries, one deployment.

```
ARCHITECTURE MAP (source doc service → your implementation)

Employability Profile Service  →  /lib/profile.ts + student_employability_profiles table
Assessment Service             →  /app/api/assessments/route.ts + assessment_results table
Evidence Service               →  /lib/evidence.ts + evidence_records table
Readiness Calculation Engine   →  /lib/readiness-engine.ts (pure deterministic TypeScript)
AI Evaluation Layer            →  /lib/ai-evaluator.ts (Claude API, Haiku-first)
Decision Trigger Service       →  readiness_events table (event log pattern)
Passport Sync Service          →  /lib/passport.ts + passport_snapshots table
Audit & Consent Service        →  audit_log table + Supabase RLS
Reporting Service              →  SQL views + /app/admin dashboard pages
```

## 2.2 System Diagram (Text Form)

```
┌─────────────────────────────────────────────────────────┐
│                    NEXT.JS 14 APP (Vercel)              │
│                                                         │
│  STUDENT UI          ADMIN UI           SHARE PAGE      │
│  /dashboard          /admin             /passport/[token]│
│      │                  │                    │          │
│  ────┴──────────────────┴────────────────────┴────      │
│                   API ROUTES                            │
│  POST /api/assessments   ← modules submit results here  │
│  POST /api/recalculate                                  │
│  GET  /api/profile/[id]                                 │
│  POST /api/passport/publish                             │
│      │                                                  │
│  ────┴──────────────────────────────────────────        │
│              CORE LIBRARIES (/lib)                      │
│  readiness-engine.ts   ← RULES ONLY, no AI              │
│  ai-evaluator.ts       ← Claude API, feedback only      │
│  evidence.ts, profile.ts, passport.ts, audit.ts         │
└──────────┬─────────────────────────┬────────────────────┘
           │                         │
    ┌──────▼──────┐          ┌───────▼────────┐
    │  SUPABASE   │          │  CLAUDE API    │
    │  Postgres   │          │  Haiku (bulk)  │
    │  + RLS      │          │  Sonnet (deep) │
    │  + Storage  │          └────────────────┘
    └─────────────┘
```

## 2.3 Database Schema (Complete Supabase SQL)

Run this in the Supabase SQL Editor as your first build step. 10 tables.

```sql
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
```

### Seed Data (run after schema)

```sql
insert into target_roles (name, description)
values ('Retail Store Associate', 'Frontline retail role — MVP target');

insert into employability_dimensions (name, category, weight) values
  ('Communication', 'soft_skill', 1.5),
  ('Digital Skills', 'digital', 1.0),
  ('Interview Readiness', 'soft_skill', 1.5),
  ('Workplace Behaviour', 'soft_skill', 1.0),
  ('Professional Profile', 'profile', 0.5);

-- One rule per dimension for the MVP role
insert into readiness_rules (dimension_id, target_role_id, threshold, strong_threshold, min_evidence_count, evidence_validity_days)
select d.dimension_id, r.role_id, 70, 85, 2, 90
from employability_dimensions d
cross join target_roles r;
```

## 2.4 The Readiness Engine (Deterministic Core)

This is the single most important file. **Pure TypeScript, zero AI, fully testable.**

`/lib/readiness-engine.ts` — logic specification:

```typescript
// PSEUDOCODE SPECIFICATION — give this to Claude Code to implement

export type DimensionStatus =
  'not_assessed' | 'developing' | 'meets_standard' | 'strong' | 'outdated';

export function calculateDimensionStatus(input: {
  evidenceItems: { score: number; createdAt: Date; verified: boolean }[];
  rule: {
    threshold: number;
    strongThreshold: number;
    minEvidenceCount: number;
    validityDays: number;
  };
  now: Date;
}): { status: DimensionStatus; effectiveScore: number | null } {

  // Step 1: Filter to VERIFIED evidence only
  const verified = input.evidenceItems.filter(e => e.verified);
  if (verified.length === 0) return { status: 'not_assessed', effectiveScore: null };

  // Step 2: Filter to evidence within validity window
  const validCutoff = /* now minus validityDays */;
  const valid = verified.filter(e => e.createdAt >= validCutoff);
  if (valid.length === 0) return { status: 'outdated', effectiveScore: null };

  // Step 3: Effective score = average of the best 3 valid scores
  const effectiveScore = /* mean of top 3 scores in `valid` */;

  // Step 4: Apply thresholds
  if (valid.length >= input.rule.minEvidenceCount + 1
      && effectiveScore >= input.rule.strongThreshold)
    return { status: 'strong', effectiveScore };

  if (valid.length >= input.rule.minEvidenceCount
      && effectiveScore >= input.rule.threshold)
    return { status: 'meets_standard', effectiveScore };

  return { status: 'developing', effectiveScore };
}

// PRI: weighted average of dimension scores mapped to 300-800
// Only dimensions with status meets_standard/strong/developing count.
// not_assessed dimensions contribute 0 to numerator but full weight
// to denominator — an unassessed dimension DRAGS the score down,
// which is correct: you can't be "ready" while unmeasured.
export function calculatePRI(dims: {
  weight: number;
  effectiveScore: number | null; // null when not_assessed/outdated
}[]): number {
  const totalWeight = /* sum of all weights */;
  const weightedSum = /* sum of weight * (effectiveScore ?? 0) */;
  const pct = weightedSum / totalWeight;      // 0-100
  return Math.round(300 + (pct / 100) * 500); // maps to 300-800
}

// Passport eligibility: ALL active dimensions at meets_standard or strong
export function isPassportEligible(statuses: DimensionStatus[]): boolean {
  return statuses.length > 0 &&
    statuses.every(s => s === 'meets_standard' || s === 'strong');
}
```

## 2.5 The AI Evaluation Layer

`/lib/ai-evaluator.ts` — Claude generates feedback ONLY. Its output is stored, never used for status decisions.

**Routing (your Haiku-first pattern):**

| Task | Model | Est. cost/call |
|---|---|---|
| Quiz feedback | claude-haiku-4-5 | < ₹0.50 |
| Written task (email) feedback | claude-haiku-4-5 | < ₹0.50 |
| Mock interview transcript analysis | claude-sonnet-4-6 | ₹2–4 |
| Simulation evaluation → raw score | claude-sonnet-4-6 | ₹2–4 |

**Important nuance:** For simulations/interviews, Claude DOES produce a raw score (there's no other way to grade free-form answers). That raw score then flows into the **rules engine** like any other assessment. The boundary holds: AI grades the artifact; rules decide the status. Store `ai_prompt_version` on every result for traceability.

**Prompt contract (every AI evaluation returns this exact JSON):**

```json
{
  "raw_score": 78,
  "strengths": ["Clear greeting", "Professional tone"],
  "gaps": ["Missing call-to-action", "Two grammar errors"],
  "student_summary": "Good email! Work on ending with a clear next step.",
  "improvement_action": "Redo the task focusing on your closing line."
}
```

## 2.6 API Surface (Next.js Route Handlers)

| Route | Method | Purpose | Auth |
|---|---|---|---|
| `/api/assessments` | POST | Intake from any module. Body: `{student_id, dimension_id, assessment_type, raw_score, max_score, submission_payload}` | Service key / internal |
| `/api/profile/[studentId]` | GET | Full profile + dimension statuses + PRI | Student (own) / admin |
| `/api/recalculate` | POST | Force recalc for a student (or all, admin) | Admin |
| `/api/passport/publish` | POST | Create snapshot + share token (requires consent flag) | Student |
| `/api/passport/revoke` | POST | Revoke a share token | Student |
| `/api/admin/dimensions` | GET/POST/PATCH | Manage dimensions | Admin |
| `/api/admin/rules` | POST | New rule version (never edit in place — insert with version+1) | Admin |
| `/passport/[token]` | GET (page) | Public read-only passport view | Token |

### The Critical Flow: POST /api/assessments (do everything here, in order)

```
1. Validate payload (zod schema)
2. INSERT assessment_results
3. Call AI evaluator → UPDATE assessment_results with ai_feedback + prompt_version
4. INSERT evidence_records (source_type='assessment', auto-verified)
5. INSERT readiness_events ('assessment_completed', 'evidence_created')
6. Run readiness engine for the affected dimension:
   a. Fetch valid evidence + active rule
   b. calculateDimensionStatus()
   c. UPDATE student_dimension_statuses
   d. If status changed → INSERT audit_log (before/after)
7. Recalculate PRI + passport eligibility → UPDATE profile
8. If dimension is 'developing' → INSERT recommendations (from AI improvement_action)
9. INSERT readiness_events ('readiness_updated')
10. Return { new_status, pri_score, feedback } to caller
```

Do this synchronously in one API route for MVP (it completes in ~5–15s including the AI call). If timeouts become an issue, move step 3 (AI) to a Vercel background function and do rules-first, feedback-after.

## 2.7 Events Without a Queue

The `readiness_events` table IS your event bus. Every action logs an event. For MVP nothing needs to "consume" them asynchronously — the API route does everything inline. But because you logged them, you get:
- A complete activity timeline per student (free feature!)
- The ability to add a Vercel Cron consumer later without changing producers
- Debugging: "what happened to this student and when"

## 2.8 Security, Consent, Audit (from Section 13 of source doc)

| Requirement | Implementation |
|---|---|
| Students control passport sharing | `consent_given` flag + revocable `share_token`; revoke sets `revoked=true`, page returns 404 |
| Employers see only approved views | Passport page reads frozen `snapshot_data`, never live tables |
| Every readiness update auditable | `audit_log` insert on every status change, with before/after JSON |
| Threshold changes versioned | Rules are insert-only with `version` column; `rule_version_applied` stored on each status |
| AI feedback traceable | `ai_prompt_version` on every assessment result |
| Encryption | Supabase provides at-rest + TLS by default ✓ |
| Data isolation | RLS policies (schema above) |

---

# PART 3 — STEP-BY-STEP BUILD PLAN

Six phases. Each phase ends with something you can see working. Each step includes what to tell Claude Code.

## Phase 0 — Setup (Half a day)

1. Create a new Supabase project (or a new schema in your GJR project — **recommendation: same project as GJR**, since this IS the evidence backbone for your PRI)
2. Create Next.js app: `npx create-next-app@latest employability --typescript --app --tailwind`
3. Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`
4. Push to GitHub, connect to Vercel
5. ✅ **Checkpoint:** "Hello world" deployed on Vercel

## Phase 1 — Database + Rules Engine (Days 1–3)

1. Run the full schema SQL from Part 2.3 in Supabase SQL Editor
2. Run the seed data SQL
3. Build `/lib/readiness-engine.ts` from the spec in Part 2.4

> **Claude Code prompt:** "Implement /lib/readiness-engine.ts exactly per this specification [paste 2.4]. Pure functions, no database calls, no AI. Then write a test file that verifies: (1) zero evidence → not_assessed, (2) old evidence only → outdated, (3) score 78 with 2 items and threshold 70 → meets_standard, (4) score 90 with 3 items → strong, (5) PRI of all-zero dims = 300 and all-100 dims = 800."

4. ✅ **Checkpoint:** All engine tests pass. This is your audit-safe core — get it right before anything else.

## Phase 2 — Assessment Intake + AI Feedback (Days 4–7)

1. Build `/lib/supabase-admin.ts` (service-role client for server routes)
2. Build `/lib/ai-evaluator.ts` with the JSON contract from 2.5 (Haiku for quiz/written, Sonnet for interview/simulation)
3. Build `POST /api/assessments` implementing the 10-step flow from 2.6
4. Test with curl/Thunder Client: post a fake quiz result, then check Supabase tables — you should see rows appear in assessment_results, evidence_records, readiness_events, student_dimension_statuses, audit_log

> **Claude Code prompt:** "Build POST /api/assessments as a Next.js 14 route handler following this exact 10-step flow [paste flow]. Use zod for validation, the service-role Supabase client, and the readiness engine from /lib/readiness-engine.ts. Wrap steps 2–9 so a failure in the AI call (step 3) does NOT block evidence creation and recalculation — status must update even if feedback fails."

5. ✅ **Checkpoint:** One curl command updates a student from not_assessed → developing → meets_standard as you post more results.

## Phase 3 — Student Dashboard (Days 8–12)

1. Supabase Auth (phone OTP or email — phone OTP fits your Tier-2/3 audience)
2. `/dashboard` page:
   - PRI dial (300–800) at top — reuse your GJR purple design system
   - Dimension cards: name, status badge (color-coded), score, evidence count
   - "Next Best Action" card (top recommendation)
   - Recent activity feed (from readiness_events)
3. `/dashboard/dimension/[id]` — evidence list with dates and scores (the "why" behind the status)
4. ✅ **Checkpoint:** Log in as a test student, see live readiness that updates when you post an assessment.

## Phase 4 — Admin Panel (Days 13–16)

1. `/admin` (protect with a simple allowlist of admin emails for MVP)
2. Dimensions table with edit (weight, active flag)
3. Rules editor — shows current version; "Save" inserts version+1 and offers "Recalculate all students"
4. Student list with PRI, status summary, drill-down to audit log
5. ✅ **Checkpoint:** Change a threshold from 70 → 75, recalculate, watch statuses shift, verify audit_log captured it.

## Phase 5 — Passport (Days 17–20)

1. `POST /api/passport/publish`: check `isPassportEligible`, require consent checkbox, freeze snapshot_data JSON, generate token
2. `/passport/[token]` public page: student name, role, PRI, dimension statuses, evidence summaries (counts + dates, not raw submissions), "Verified by GetJobReady" badge, published date
3. Revoke button on student dashboard
4. ✅ **Checkpoint:** Publish a passport, open the link in incognito, revoke it, confirm the link dies.

## Phase 6 — Wire In Real Assessments (Days 21+)

Now connect your existing GJR modules — each just needs to POST to `/api/assessments`:

| GJR Module | dimension_id | assessment_type |
|---|---|---|
| Role-Play Simulation Engine | Workplace Behaviour | simulation |
| Voice/Interview Engine | Interview Readiness | mock_interview |
| Quizzes (Assessment Engine) | Digital Skills | quiz |
| Email/written tasks | Communication | written_task |
| ResumeAI / profile completion | Professional Profile | digital_task |

This is the payoff of the architecture: **every existing and future GJR feature becomes an evidence producer with one API call.**

---

# PART 4 — QUICK REFERENCE

## Build Order Summary
```
Phase 0: Setup (0.5 day)
Phase 1: Schema + Rules Engine (3 days)      ← the audit-safe core
Phase 2: Intake API + AI Feedback (4 days)   ← the heart
Phase 3: Student Dashboard (5 days)
Phase 4: Admin Panel (4 days)
Phase 5: Passport (4 days)
Phase 6: Module integration (ongoing)
Total MVP: ~3-4 weeks solo with Claude Code
```

## Non-Negotiable Principles (tape these above your desk)
1. **No status without evidence.** Ever.
2. **AI grades artifacts; rules decide statuses.**
3. **Rules are insert-only and versioned.** Never edit a rule row.
4. **Every status change writes to audit_log.**
5. **Passports are frozen snapshots**, never live queries.
6. **All writes go through server routes** (service role); students only read via RLS.

## Cost Estimate (Pilot, 50 students, 5 assessments/week each)
- Supabase: Free tier sufficient
- Vercel: Free tier sufficient
- Claude API: ~1,000 evaluations/month × avg ₹1.50 ≈ **₹1,500/month**
- Total: **under ₹2,000/month**
