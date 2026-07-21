# CHANGELOG.md

Technical, commit-level changelog. Format loosely follows [Keep a Changelog](https://keepachangelog.com/). For product-facing summaries see `RELEASE_NOTES.md`; for full architectural context see `PROJECT_CONTEXT.md`.

## [Unreleased] — Session 9: PRI Dial + Next Best Action (2026-07-21)

### Added
- `src/components/dashboard/pri-dial.tsx`: semicircular PRI gauge (300–800), custom SVG (no new dependency), animates from 0 to the real score on mount via `requestAnimationFrame`, `prefers-reduced-motion`-aware (`motion-reduce:transition-none`), `role="img"` + `aria-label` with the score in plain text, "Not yet scored" state when `pri_score` is null.
- `src/components/dashboard/next-best-action-card.tsx`: shows the student's top open (`completed = false`) recommendation with its `action_link`; positive empty state when none are open. `RecommendationData` (`src/lib/dashboard-data.ts`) carries optional `reasoning`/`confidence`/`estimatedImpact`/`estimatedCompletionMinutes` fields, rendered only when present, so a future AI-generated layer can populate them without a redesign.
- `src/components/dashboard/dimension-cards.tsx`: Session 8's dimension-card markup, moved out of `page.tsx` unchanged (same classes, same badge mapping).
- `src/components/dashboard/*-skeleton.tsx` (three files) + `dashboard-section-error.tsx`: per-section Suspense loading skeletons and a shared friendly-error presentation, visually distinct from a legitimate empty state.
- `src/lib/dashboard-data.ts`: `getDimensionCards`, `getPriScore`, `getNextBestAction` — dashboard data-fetching/transformation extracted out of the page component. Each returns a `DataResult<T>` (`{ ok: true, data }` | `{ ok: false, error }`) instead of throwing, so a query failure can render a friendly, distinguishable error instead of only being `console.error`-logged.

### Changed
- `src/app/dashboard/page.tsx`: restructured to pure orchestration — one auth check, three independently-streamed `<Suspense>` sections (PRI dial, Next Best Action, dimension cards), each backed by a small async section function that calls a `dashboard-data.ts` helper and renders either the real component or `DashboardSectionError`. No visual or behavioral change to the existing dimension cards; purely additive for the dial and action card.

### Notes
- Evaluated adding a lightweight gauge/chart library for the PRI dial; rejected as an unnecessary dependency for a single semicircular arc (project has none installed, per `PROJECT_CONTEXT.md`'s locked stack) — implemented as custom SVG instead.
- No database migration, no API route changes — this session is entirely additive reads against existing tables (`student_employability_profiles.pri_score`, `recommendations`) using the existing RLS-respecting server client.
- The dial's mount animation and a pixel-level screenshot could not be captured in this session's dev preview browser — its tab runs backgrounded in this environment, which pauses `requestAnimationFrame` (confirmed via `document.hidden === true` and a direct rAF probe). Verified instead via the accessibility tree (correct ARIA labels and content for every state: scored, null, skeleton, empty, error) and zero console errors on load/resize. Manual live verification on `/dashboard` is still recommended.

## [Session 8 Stabilization] — 2026-07-20

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
