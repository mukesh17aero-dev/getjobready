# CHANGELOG.md

Technical, commit-level changelog. Format loosely follows [Keep a Changelog](https://keepachangelog.com/). For product-facing summaries see `RELEASE_NOTES.md`; for full architectural context see `PROJECT_CONTEXT.md`.

## [Unreleased] — Session 8 Stabilization (2026-07-20)

### Fixed
- **Root cause of the Session 7 login failure**: replaced `verifyOtp(token_hash)` (required email template customization, unavailable on Supabase's free tier since a June 2026 policy change) with the original `exchangeCodeForSession` PKCE flow, which works with Supabase's default, unedited templates. `/auth/callback` is a server Route Handler again.
- **Root cause of the "Session 8 dashboard disappeared" report**: `employability_dimensions`, `target_roles`, `readiness_rules` had RLS enabled with zero policies at the database layer (not a code regression — confirmed via byte-identical diff against the Session 8 commit). Restored public-read policies.
- **Audit-driven fixes**: `students` table had RLS enabled since Session 2 with no policy at all (dormant gap, now fixed); `readiness_events` and `audit_log` had no RLS at all (now locked to service-role-only, the correct state for an internal event log and audit trail).
- ESLint `react-hooks/set-state-in-effect` error in `src/app/login/page.tsx` (first caught by this pass — `npm run lint` had not previously been run standalone).
- TypeScript build error from non-null-assertion env vars not narrowing across function boundaries (`src/lib/supabase-browser.ts`, `src/lib/supabase-server.ts`), surfaced while fixing the above.

### Added
- `src/lib/env.ts` — shared `requireEnv()` helper, replacing four duplicated inline env-var guards.
- `supabase/migrations/0003_complete_database_repair.sql` — complete, idempotent RLS/seed audit and repair covering all 12 tables.
- Error logging on previously-silent Supabase call failures: `src/app/dashboard/page.tsx` (both data queries), `src/lib/onboard-student.ts` (both inserts), `src/app/auth/signout/route.ts`.
- Full documentation set: `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, `SESSION_PROGRESS.md`, `CHANGELOG.md`, `RELEASE_NOTES.md`.

### Removed
- `src/app/auth/confirm/route.ts` and the `token_hash`-based verification path (superseded, see Fixed).
- `src/app/api/auth/onboard/route.ts` and the numeric one-time-code login UI (dead code once magic-link-only was confirmed as the chosen approach).
- Various temporary diagnostic scripts and routes created during investigation (all removed immediately after use throughout Sessions 7–8; confirmed via `git status` at each step and again in this audit).

### Changed
- `src/lib/supabase-admin.ts`, `supabase-browser.ts`, `supabase-server.ts`, `src/middleware.ts` now use `requireEnv()` instead of non-null assertions (`!`) on environment variables.

## [Session 8] — 2026-07-18

### Added
- `src/app/dashboard/page.tsx`: dimension cards for all 5 employability dimensions, color-coded status badges (exact mapping per `docs/PLAYBOOK.md`), default "Not Assessed" state for students with no assessment history.

## [Session 7] — 2026-07-18

### Added
- Email magic-link authentication end-to-end: `src/lib/supabase-browser.ts`, `supabase-server.ts`, `src/middleware.ts`, `src/app/login/page.tsx`, `src/app/auth/callback/route.ts`, `src/app/auth/signout/route.ts`, `src/lib/onboard-student.ts`.
- `supabase/migrations/0001_students_soft_delete.sql`, `scripts/delete-test-student.ts` (Issue 2: Supabase Dashboard user deletion was blocked by FK constraints with no cascade — by design, see `DATABASE_SCHEMA.md`).

### Fixed
- Multiple auth root-cause iterations — see `PROJECT_CONTEXT.md` Session History for the full incident chain (this was the longest single-session debugging arc in the project so far).

## [Session 6] — 2026-07-18

### Added
- `src/lib/ai-evaluator.ts`: Claude API wrapper (Haiku/Sonnet routing, retry-once-on-malformed-JSON, never-throws contract), wired into the assessment intake route's step 3.

## [Session 5] — 2026-07-18

### Added
- `POST /api/assessments`: full 10-step intake flow (rules only, no AI yet). `src/lib/supabase-admin.ts`, `scripts/seed-test-student.ts`.

## [Session 3–4] — 2026-07-18

### Added
- `src/lib/readiness-engine.ts`: `calculateDimensionStatus`, `calculatePRI`, `isPassportEligible` — pure, deterministic, 18 tests total.

## [Session 1–2] — 2026-07-18

### Added
- Vitest configured. Full 12-table Supabase schema + seed data + `scripts/verify-db.ts`.
