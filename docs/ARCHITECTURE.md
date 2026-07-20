# ARCHITECTURE.md

Technical architecture reference. For product/business context see `PROJECT_CONTEXT.md`; for the database specifically see `DATABASE_SCHEMA.md`.

---

## Style: Modular Monolith

One Next.js 16 App Router application, one Vercel deployment, one Supabase project. The source architecture doc (ASCEND-ENG-004) describes 9 logical services; each is implemented as a folder of TypeScript functions rather than a separate deployable service:

```
Employability Profile Service  →  src/lib/onboard-student.ts + students / student_employability_profiles tables
Assessment Service              →  src/app/api/assessments/route.ts + assessment_results table
Evidence Service                →  evidence_records table (written inline in the assessment route)
Readiness Calculation Engine    →  src/lib/readiness-engine.ts (pure, deterministic, zero DB/AI dependencies)
AI Evaluation Layer             →  src/lib/ai-evaluator.ts (Claude API, feedback only)
Decision Trigger Service        →  readiness_events table (event log, no message queue)
Passport Sync Service           →  not yet built (Session 14+)
Audit & Consent Service         →  audit_log table + Supabase RLS
Reporting Service                →  not yet built (Session 11+ admin panel)
```

## Request Flow

```
┌──────────────────────────────────────────────────────────┐
│                 NEXT.JS 16 APP (Vercel)                   │
│                                                            │
│  /login          /dashboard         /auth/callback         │
│  (public)        (middleware-       (PKCE exchange +       │
│                   protected)         onboarding)            │
│      │                │                    │                │
│  ────┴────────────────┴────────────────────┴────           │
│                    ROUTE HANDLERS                            │
│  POST /api/assessments   ← GJR modules submit results here  │
│      │                                                       │
│  ────┴─────────────────────────────────────────             │
│              CORE LIBRARIES (src/lib)                        │
│  readiness-engine.ts   ← RULES ONLY, no AI                   │
│  ai-evaluator.ts       ← Claude API, feedback only           │
│  onboard-student.ts, supabase-{admin,server,browser}.ts      │
└──────────┬─────────────────────────┬─────────────────────────┘
           │                         │
    ┌──────▼──────┐          ┌───────▼────────┐
    │  SUPABASE   │          │  CLAUDE API    │
    │  Postgres   │          │  Haiku (bulk)  │
    │  + RLS      │          │  Sonnet (deep) │
    └─────────────┘          └────────────────┘
```

## The AI vs. Rules Boundary (non-negotiable)

AI (Claude) grades artifacts and generates feedback. It **never** sets a readiness status directly. `src/lib/readiness-engine.ts` is the single source of truth for status transitions, and it is deliberately pure — no database calls, no AI calls, no side effects, fully unit-tested (18 tests covering every branch). `src/app/api/assessments/route.ts` step 3 calls the AI evaluator for qualitative feedback and (for interview/simulation types) a raw score; that raw score then flows into the readiness engine like any other input — the engine, not the AI, decides the resulting status.

## The Assessment Intake Flow (10 steps)

`POST /api/assessments`, in order (see `docs/BUILD_GUIDE.md` §2.6 for the original spec):

1. Validate payload with zod.
2. Insert `assessment_results`.
3. Call the AI evaluator (feedback only) — failure here is caught and logged, never blocks steps 4–10.
4. Insert `evidence_records` (auto-verified).
5. Insert `readiness_events` (`assessment_completed`, `evidence_created`).
6. Fetch all evidence + the active rule for the dimension; run `calculateDimensionStatus`; upsert `student_dimension_statuses`; insert `audit_log` if the status changed.
7. Recalculate PRI and passport eligibility across all dimensions; update `student_employability_profiles`.
8. Insert a `recommendations` row if the dimension is `developing` and AI produced an `improvement_action`.
9. Insert `readiness_events` (`readiness_updated`).
10. Return `{ new_status, pri_score }`.

Every step that can fail returns an explicit `500` with a message — there is no silent partial-failure path in this route.

## Authentication Architecture

See `PROJECT_CONTEXT.md` → Authentication Decisions for the full rationale and rejected alternatives. Summary of the current, final flow:

```
/login (client component)
  → supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } })
  → Supabase sends a magic-link email using its DEFAULT, unedited template
      (free-tier template customization is unavailable without custom SMTP)

user clicks the link (same browser/device — a PKCE requirement)
  → Supabase's hosted /auth/v1/verify redirects to /auth/callback?code=...

/auth/callback (server Route Handler)
  → exchangeCodeForSession(code)     [uses src/lib/supabase-server.ts]
  → ensureStudentOnboarded()         [src/lib/onboard-student.ts, service role]
  → redirect to /dashboard

middleware.ts (runs on every /dashboard/* request)
  → reads the session cookie via a request-scoped Supabase client
  → redirects to /login if no valid user
```

## Row Level Security Architecture

Three-tier model, audited and repaired as of `supabase/migrations/0003_complete_database_repair.sql`:

1. **Public reference data** (`target_roles`, `employability_dimensions`, `readiness_rules`): RLS enabled, `for select using (true)` — freely readable by anyone, writable only via the service role.
2. **Per-student data** (`students`, `student_employability_profiles`, `student_dimension_statuses`, `assessment_results`, `evidence_records`, `recommendations`, `passport_snapshots`): RLS enabled, `for select using (auth.uid() = student_id)` (passport_snapshots additionally allows `for all`, anticipating student-driven publish/revoke in Session 14). No insert/update policies anywhere in this tier — every write goes through the service role from trusted server code.
3. **Internal-only data** (`readiness_events`, `audit_log`): RLS enabled, **zero policies** — deliberately locked to service-role-only access. Confirmed via grep that nothing in the app reads or writes these tables except through `supabaseAdmin`.

**Operational rule, learned the hard way:** never toggle RLS on via the Supabase Dashboard's per-table "Enable RLS" prompt without adding a policy in the same sitting. Doing exactly that (most likely via the Dashboard's Security Advisor, which flags every RLS-less public table) silently broke the Session 8 dashboard for an entire debugging cycle — the symptom (empty query result, zero error) is indistinguishable from "the table is genuinely empty" without directly comparing a service-role query against an anon-key one.

## Testing Architecture

Vitest, `src/lib/readiness-engine.test.ts` (15 tests) and `src/lib/ai-evaluator.test.ts` (3 tests, mocking `@anthropic-ai/sdk`). The readiness engine is the audit-safe core and is tested exhaustively per `CLAUDE.md`'s explicit requirement; UI is not unit-tested (per `CLAUDE.md`, UI tests are optional) — verified instead via live end-to-end checks against the running dev server and, where a real browser session isn't reproducible (PKCE flows), via direct Supabase API calls that exercise the identical code path server-side (see `PROJECT_CONTEXT.md` Session History for examples of this technique in practice).
