# PROJECT_CONTEXT.md

**This is the authoritative knowledge base for GetJobReady.ai (`gjr-employability`).** Read this file completely, and `SESSION_PROGRESS.md`, before starting any new session. If a requested change conflicts with a decision documented here, explain the conflict and propose options before implementing — don't silently override it.

Last updated: 2026-07-20 (post-Session-8 stabilization).

---

## Product Vision

**Purpose:** GetJobReady.ai answers one question with proof: *"Is this student ready for this job?"* Frontline job seekers in India (Tier-2/3 cities) complete assessments (quizzes, mock interviews, written tasks, simulations); the platform converts those into an auditable **PRI (Personal Readiness Index, 300–800)** and per-dimension readiness statuses, never claiming readiness without stored evidence backing it.

**Target users:**
- **Student** (primary, and the only user-facing role built so far) — mobile-first, Tier-2/3 city job seeker.
- **Admin** (platform operator, not yet built — Session 11+).
- **Employer** (future — views student-approved passports via a link, not yet built — Session 14+).

**Business goals:** give employers a credible, evidence-backed alternative to "course completed = ready" claims; give students a clear, actionable picture of their own readiness and what to do next.

**MVP scope:** Student + Admin only, one target role (Retail Store Associate), one employability framework (5 dimensions). See `docs/BUILD_GUIDE.md` §1.7 for the full in/out-of-scope list — notably, employer/institution portals, coding assessments, multi-language, and native apps are explicitly out of scope until requested.

**Long-term roadmap:** Sessions 9–18 per `docs/PLAYBOOK.md` (PRI dial, evidence drill-down, admin panel, passport publish/revoke, hardening, real GJR module integration, pilot readiness). Each removed enterprise-scale feature (employer portal, multi-model AI, Kafka/Redis, multi-tenancy, etc.) has an explicit "add back when" trigger documented in `CLAUDE.md`.

---

## Technology Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 16.2.10, App Router, TypeScript strict, Tailwind CSS (plain utility classes — no shadcn/ui yet, see Known Constraints) |
| Backend | Next.js Route Handlers (`/app/api/**`) — modular monolith, no separate backend service |
| Database | Supabase Postgres (Free Tier) |
| Authentication | Supabase Auth, email magic-link (PKCE), no custom SMTP |
| Hosting | Vercel (target — see Known Constraints on push status) |
| AI services | Anthropic Claude API directly via `@anthropic-ai/sdk` — Haiku for quiz/written/digital tasks, Sonnet for interviews/simulations |
| Testing | Vitest |
| Package manager | npm |

**Locked and explicitly forbidden** (per `CLAUDE.md`, do not introduce without asking): NestJS, FastAPI, Prisma, Redis, Kafka, Docker, Kubernetes, Terraform, LangChain/LangGraph, microservices, multi-tenancy. Reasoning: the founder is non-technical and must be able to deploy via `git push` and debug via the Vercel/Supabase dashboards alone — every added tool is a tool he can't operate.

**Known deviation:** `CLAUDE.md` specifies "Next.js 14" as the locked version; the actual installed version is 16.2.10. This was discovered during Session 7 (the `middleware.ts` → `proxy.ts` deprecation warning) and has been treated as "flag, don't silently upgrade or downgrade" throughout — see Known Constraints.

---

## Folder Structure

```
src/
  app/
    page.tsx, layout.tsx        default Next.js scaffold (untouched, not yet product-relevant)
    login/page.tsx              student login (magic-link request form)
    auth/
      callback/route.ts         PKCE code exchange — completes magic-link login
      signout/route.ts          logout
    dashboard/page.tsx          student dashboard (dimension cards, Session 8)
    api/
      assessments/route.ts      POST intake — the 10-step assessment→evidence→status flow
  lib/
    env.ts                      requireEnv() — shared env-var validation helper
    supabase-admin.ts           service-role client (bypasses RLS) — server-only, never import client-side
    supabase-server.ts          request-scoped, cookie-based client — respects RLS, use in Server Components/Route Handlers
    supabase-browser.ts         browser client — respects RLS, use in Client Components
    onboard-student.ts          ensureStudentOnboarded() — creates students + profile row on first login
    readiness-engine.ts         pure, deterministic status/PRI/eligibility logic — no DB, no AI (the audit-safe core)
    ai-evaluator.ts             Claude API wrapper — feedback/scoring only, never sets status
  middleware.ts                 protects /dashboard/*, redirects unauthenticated requests to /login
scripts/
  verify-db.ts                  prints every table + row count
  seed-test-student.ts          creates/resets a fixed-UUID test student (11111111-1111-4111-8111-111111111111)
  delete-test-student.ts        safely deletes a test student across all dependent tables + auth.users
supabase/
  schema.sql                    original Session 2 schema (12 tables + initial RLS)
  seed.sql                      original Session 2 seed data
  migrations/                   numbered, sequential — see DATABASE_SCHEMA.md for what each does
docs/                           this file and its siblings
```

**Why `/lib` and `/app/api` instead of separate services:** the source architecture doc (ASCEND-ENG-004) describes 9 logical services (Profile, Assessment, Evidence, Readiness Engine, AI Evaluation, Decision Trigger, Passport Sync, Audit, Reporting). For a solo, non-technical founder, each becomes a folder of TypeScript functions inside this one app — same boundaries, one deployment. See `CLAUDE.md` and `docs/BUILD_GUIDE.md` §2.1.

---

## Coding Conventions

- **Naming:** kebab-case file names (`supabase-admin.ts`, `onboard-student.ts`), camelCase functions/variables, PascalCase React components and TypeScript types/interfaces.
- **File organization:** one Supabase client variant per file (`admin`/`server`/`browser`), each with a comment explaining when to use it and why it's distinct from the others. Route handlers colocated under their URL path per Next.js App Router convention.
- **Component structure:** Server Components by default; `"use client"` only where interactivity (forms, `useState`/`useEffect`) requires it. No component library yet — plain Tailwind utility classes, matching whatever the founder has already approved in `login/page.tsx` and `dashboard/page.tsx`.
- **TypeScript conventions:** strict mode, **zero `any`** (verified zero occurrences as of this audit). Supabase query results are cast through minimal hand-written row interfaces (e.g. `AssessmentResultRow`) rather than using generated Database types (no `supabase gen types` step exists yet). Required env vars are read via `requireEnv()` (`src/lib/env.ts`), never bare non-null assertions (`!`) — this pattern exists specifically because non-null assertions don't narrow across function boundaries in TypeScript, which caused a real build failure during this stabilization pass.
- **Error handling:** every Supabase call in a Route Handler checks `error` and returns an explicit HTTP error response (see `/api/assessments/route.ts` for the canonical pattern — every one of its 10 steps has its own error branch). AI call failures (`ai-evaluator.ts`) return `null` and never throw — a broken AI call must never block evidence creation or status recalculation (`CLAUDE.md` requirement). Server Components that fetch data now log (`console.error`) on query failure rather than silently rendering empty state — added after a real incident where a silent RLS-driven empty result was indistinguishable from "no data" (see Session History, Session 8 stabilization).
- **API conventions:** Route Handlers validate all input with `zod` (`CLAUDE.md` requirement, no exceptions). All database *writes* go through `supabaseAdmin` (service role) from server-side code only; students *read* exclusively through RLS via `supabase-server.ts`/`supabase-browser.ts`. This split is load-bearing — do not read through the service role from a page a student's browser could reach without also being certain that's intentional (e.g. the assessment intake API deliberately uses service role since it's called by trusted GJR modules, not directly by student browsers).
- **Styling conventions:** Tailwind utility classes inline in JSX; a small purple-accented palette (`bg-purple-700` primary actions, status colors specified exactly in `docs/PLAYBOOK.md` Session 8: not_assessed=gray, developing=amber, meets_standard=green, strong=purple, outdated=red). No design-token file or shadcn/ui yet.

---

## Database Decisions

See `docs/DATABASE_SCHEMA.md` for the full table-by-table reference. Summary of decisions:

- **RLS strategy:** every table students can reach (directly or via reference data) has RLS enabled with an explicit policy — reference/config tables (`target_roles`, `employability_dimensions`, `readiness_rules`) are publicly readable (`using (true)`); per-student tables restrict to `auth.uid() = student_id`; `audit_log` and `readiness_events` are RLS-enabled with **no** student-facing policy at all (service-role-only by design — an audit trail must not be readable or writable by the entities it describes). **Never enable RLS on a table via the Supabase Dashboard's "Enable RLS" prompt without adding a policy in the same sitting** — doing exactly that (likely via the Dashboard's Security Advisor) silently broke the Session 8 dashboard for an entire debugging cycle. See Known Constraints and Session History for the full incident.
- **Migration strategy:** numbered, sequential files in `supabase/migrations/`, applied manually via the Supabase SQL Editor (no CLI/migration-runner tooling — the founder doesn't have direct Postgres access, only the Dashboard). Each migration is written to be idempotent (safe to re-run) since there's no migration-tracking table recording what's already been applied.
- **Seed data strategy:** `supabase/seed.sql` for the original one-time seed; later migrations re-assert seed data idempotently (`where not exists` guards) as a defensive measure, not because data has been lost.
- **Reference tables:** `target_roles`, `employability_dimensions`, `readiness_rules` — freely readable by any client (anon or authenticated), writable only via service role. Currently seeded with 1 role (Retail Store Associate) and 5 dimensions (Communication 1.5, Digital Skills 1.0, Interview Readiness 1.5, Workplace Behaviour 1.0, Professional Profile 0.5 — weights per `supabase/seed.sql`).
- **Student data model:** `students` (1 row per `auth.users`, no cascade delete — see below) → `student_employability_profiles` (1 per student per target role) → `student_dimension_statuses` (1 per student per dimension, the dashboard's primary data source) ← fed by `assessment_results` → `evidence_records` → `readiness_events` (event log) and `audit_log` (status-change history). `students.student_id references auth.users(id)` has **no `ON DELETE CASCADE`** — deliberate, to prevent a single Supabase Dashboard delete from silently destroying a student's evidence/audit trail. `students.deleted_at` exists as the foundation for a future soft-delete admin action; hard-deleting a real student is never correct — use `scripts/delete-test-student.ts` for dev/test cleanup only.

---

## Authentication Decisions

**Current flow: Supabase Auth, email magic-link only, PKCE, default (unedited) email templates.**

- `signInWithOtp({ email, options: { emailRedirectTo: '.../auth/callback' } })` called from the browser client (`src/lib/supabase-browser.ts`, which defaults to `flowType: 'pkce'`).
- `src/app/auth/callback/route.ts` (a server Route Handler) calls `exchangeCodeForSession(code)`, then `ensureStudentOnboarded()`, then redirects to `/dashboard`.
- `src/middleware.ts` protects `/dashboard/*`, redirecting unauthenticated requests to `/login`.
- Session state lives in cookies managed by `@supabase/ssr`, shared between the browser client and server-side clients.

**Why this specific design, and what was rejected:**
- **`verifyOtp({token_hash, type})` was tried and reverted.** It's PKCE-free and more robust in principle, but requires the email template to embed `{{ .TokenHash }}` — Supabase changed free-tier policy in **June 2026** so free-tier projects on the default email provider can no longer customize auth email templates at all (confirmed via official docs, not assumption). This project cannot use that mechanism. Do not reintroduce it unless the founder adds custom SMTP and explicitly asks to revisit.
- **A numeric one-time-code entry path was tried and removed.** Same template restriction blocks it (the default template never shows a visible code). Removed as dead UI once magic-link-only was confirmed as the chosen approach.
- **Password auth and phone OTP were offered and declined.** The founder explicitly chose to keep magic-link-only despite the free-tier email rate limit, accepting it as a known, temporary constraint until Resend SMTP is configured before beta. Don't re-litigate this without the founder raising it again.
- **The "PKCE code verifier not found in storage" error is Supabase's own documented, inherent PKCE limitation** (the code exchange must happen in the same browser/device that requested the link) — not a code bug. `/login`'s UI copy calls this out directly.

**Known authentication decisions to preserve:**
- All writes during onboarding go through `supabaseAdmin` (service role) — students never write their own `students`/`student_employability_profiles` rows directly.
- `ensureStudentOnboarded()` is idempotent (no-ops if the student already exists) — safe to call on every login, not just the first.

---

## UI Principles

- **Design system:** none formally adopted yet. Plain Tailwind, a purple accent (`purple-700`/`purple-900`), matching what's already shipped — CLAUDE.md's "GJR purple design system" and a "frontend-design skill" are referenced in `docs/PLAYBOOK.md` but no such skill exists in this environment; this was flagged, not fabricated, when first encountered (Session 8).
- **Colour palette:** status badges use an exact, Playbook-specified mapping — not_assessed=gray-200/700, developing=amber-100/800, meets_standard=green-100/800, strong=purple-100/800, outdated=red-100/800. Primary actions use `purple-700`.
- **Typography:** default Next.js font stack (Geist Sans/Mono from `layout.tsx`, untouched scaffold).
- **Spacing:** Tailwind's default scale, mobile-first single-column layouts (`max-w-md`/`max-w-sm` containers).
- **Accessibility:** form inputs have associated `<label>`s; error text uses `role="alert"`. Not formally audited beyond this.
- **Responsive design:** mobile-first per `docs/PLAYBOOK.md` explicit requirement (target users are Tier-2/3 city, mobile-first).
- **Component reuse:** minimal — no shared component library yet; each page is self-contained. Revisit once a second page needs the same card/badge pattern as the dashboard.
- **Loading states:** button-level only (`disabled` + text swap, e.g. "Sending..." on the login button). No skeleton/spinner patterns yet.
- **Empty states:** the dashboard renders all 5 dimensions with default "Not Assessed" values for a student with no assessment history yet — this is intentional, correct behavior, not a bug (verified explicitly during the Session 8 stabilization investigation).
- **Error states:** `/login` shows inline error text (`role="alert"`, red) fed by either a failed `signInWithOtp` call or an `?error=` query param from a failed `/auth/callback` redirect.

---

## Session History

| # | Objective | Features implemented | DB changes | Key decisions / lessons learned |
|---|---|---|---|---|
| 0 | Project setup | Next.js app, Supabase project, GitHub, Vercel | — | Manual founder setup; `docs/` seeded with `CLAUDE.md`, `BUILD_GUIDE.md`, `PLAYBOOK.md` |
| 1 | Bootstrap tooling | Vitest configured, `PROGRESS.md` created | — | Founder rejected an unsolicited "improvement" (swapping a working Vitest plugin for a native option) — established the standing rule: flag newer approaches, never silently adopt them |
| 2 | Schema + seed | — | Full 12-table schema + seed data (`supabase/schema.sql`, `seed.sql`) | Manual SQL Editor execution (founder has no CLI/direct DB access) |
| 3 | Readiness engine pt.1 | `calculateDimensionStatus` (pure, 9 tests) | — | Audit-safe core, zero DB/AI dependencies |
| 4 | Readiness engine pt.2 | `calculatePRI`, `isPassportEligible` | — | 15 tests total, all passing |
| 5 | Assessment intake | `POST /api/assessments`, full 10-step flow (rules only, no AI yet) | — | Verified end-to-end via real curl walkthrough (not_assessed→developing→meets_standard) |
| 6 | AI evaluation | `ai-evaluator.ts`, wired into intake step 3 | — | Flagged (not silently fixed): Build Guide's model IDs (`claude-haiku-4-5`, `claude-sonnet-4-6`) may not match current Anthropic model IDs; real test blocked by insufficient API credit, not a code issue |
| 7 | Auth | Email magic-link login, `/auth/callback`, middleware, onboarding | `students.deleted_at` added (migration 0001) | **The longest, hardest-won session.** See below for the full incident chain. |
| 7 (Issue 2) | Bug: can't delete Supabase user | `scripts/delete-test-student.ts` | Migration 0001 (soft-delete foundation) | Root cause: `students.student_id → auth.users` has no `ON DELETE` clause; deliberately not fixed with CASCADE (would silently destroy audit history) |
| 8 | Dashboard | Dimension cards, status badges, evidence count | — | Code shipped correctly on first pass; **broke invisibly afterward** via a database-layer RLS change (see below) — not a code regression |
| 8 (stabilization) | Full auth root-cause fix + RLS incident + cleanup | Final `/auth/callback` (PKCE + default templates), migration 0003 (full RLS audit), env-var refactor, error-handling additions, this documentation set | Migrations 0002, 0003 | See full incident summary below |

### The Session 7 authentication incident (worth understanding in full — it shaped several standing rules)

1. Initial magic-link implementation used `exchangeCodeForSession` — worked in principle, but real-world testing hit "PKCE code verifier not found in storage."
2. First hypothesis (browser/device mismatch) was correct in spirit but under-diagnosed — added better error surfacing, which was a real improvement but not the fix.
3. Second hypothesis chased implicit-flow hash fragments (proven possible via direct testing of Supabase's admin API, but not what real `signInWithOtp` traffic actually produces) — built a client-page workaround, later reverted as unnecessary complexity.
4. **The actual, confirmed-via-live-search root cause:** Supabase's free tier stopped allowing email template customization in June 2026. The `verifyOtp(token_hash)` approach (which needs `{{ .TokenHash }}` in the template) was accordingly reverted, and the original PKCE `exchangeCodeForSession` approach — which works with Supabase's default, unedited templates — was restored as final.
5. **Separately, after auth was fixed, the dashboard appeared broken** ("Session 8 was lost"). It hadn't been — `git diff` against the Session 8 commit was byte-identical. The actual cause: `employability_dimensions`, `target_roles`, and `readiness_rules` had RLS silently enabled with zero policies (most likely via Supabase's Dashboard Security Advisor "Enable RLS" prompt, clicked without an accompanying policy) — a **database-level change with no code footprint at all**, diagnosed by comparing service-role vs. anon-key query results directly.

**Lesson encoded into the Coding Conventions above:** Server Components must log query errors, not just silently render on empty data — this exact ambiguity (empty table vs. RLS denial) cost an entire debugging cycle because nothing distinguished them.

---

## Known Constraints

- **Supabase Free Tier:** built-in email service is rate-limited to a handful of sends per hour by design (not a bug) — accepted as temporary until Resend SMTP is added before beta. Email template customization is unavailable on this tier without custom SMTP (a real, recently-changed platform constraint, not a misunderstanding).
- **Authentication limitations:** magic-link only; requires same-browser/device continuity per PKCE's design (Supabase's own documented limitation). No password or phone-OTP fallback currently implemented.
- **Storage limitations:** none exercised yet — no file/audio evidence uploads built (Build Guide anticipates Supabase Storage for e.g. interview audio, not yet needed).
- **Scalability assumptions:** single target role, single cohort model; MVP explicitly assumes one role until a second is requested (`CLAUDE.md`).
- **Current technical debt:**
  - `middleware.ts` uses a convention Next.js 16 has deprecated in favor of `proxy.ts` (still functional, just warns on build) — not migrated, per the "flag, don't silently adopt" rule; revisit if the founder wants to address the warning.
  - No generated Supabase `Database` types — row shapes are hand-maintained interfaces per file, which can drift from the real schema if a migration changes a column without a corresponding code update.
  - `student_dimension_statuses.evidence_count` counts *all* evidence records for a dimension (not just those within the validity window) — a deliberate interpretation (see `src/app/api/assessments/route.ts` step 6c), not yet revisited against how the future evidence drill-down page (Session 10) will want to present it.
  - No RLS regression test exists — the Session 8 RLS incident was caught by manual dashboard inspection, not automated tooling. Consider a lightweight anon-key smoke check in a future hardening session.
- **Deployment status:** the founder pushes to GitHub manually; this project (Claude Code) never runs `git push` unless explicitly instructed to. Vercel deployment status/currency is not verified as part of this documentation pass — check `git log origin/main` before assuming production reflects the latest commit.

---

## Future Development Rules

1. Never introduce breaking changes without explanation.
2. Preserve backward compatibility whenever possible.
3. Do not modify working features without evidence — trace and prove a root cause before changing code (see the Session 7/8 incidents above for what happens when this discipline slips: two false-start fixes before the real root causes were found).
4. Always investigate before changing architecture. If a requested change conflicts with a decision documented here, explain the conflict and propose options — don't silently override it.
5. Keep production readiness as the primary goal; keep the stack within what a non-technical, solo founder can operate via `git push` and the Vercel/Supabase dashboards.
6. Maintain enterprise-grade coding standards within the deliberately small scope: strict TypeScript, zod validation on every API input, comprehensive error handling, zero `any`.
7. **Update this file whenever an architectural decision changes.** It is the source of truth future sessions read first.
