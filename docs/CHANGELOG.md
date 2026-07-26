# CHANGELOG.md

Technical, commit-level changelog. Format loosely follows [Keep a Changelog](https://keepachangelog.com/). For product-facing summaries see `RELEASE_NOTES.md`; for full architectural context see `PROJECT_CONTEXT.md`.

## [Session 10] — 2026-07-26: Evidence Drill-Down

### Added
- `src/app/dashboard/dimension/[id]/page.tsx`: the "why is my status what it is" page. Server Component, same auth-check pattern as `/dashboard` (redirect to `/login` if unauthenticated — also covered by `middleware.ts`'s existing `/dashboard/:path*` matcher, no middleware change needed). Header shows dimension name, status badge, score, evidence count, last updated, and the active rule in plain language (e.g. "Needs 2 pieces of evidence scoring 70+ within the last 90 days."). One `<Suspense>` boundary wraps a single consolidated fetch (header + evidence together, since they share the same rule/dimension data — splitting them would mean fetching that shared data twice).
- `src/lib/dashboard-data.ts`: new `getDimensionDetail()`, same `DataResult<T>`/never-throw contract as the three existing functions. Runs dimension, status, rule, and evidence queries in parallel, then one batched `assessment_results` lookup keyed by the evidence rows' `source_id`s (`.in("assessment_id", ids)` + `Map` join — the same batch-fetch pattern `getDimensionCards` already uses) instead of one query per evidence item. 5 Supabase round trips total regardless of evidence count. Rule lookup filters by `dimension_id` + `active` only, no `target_role_id` join — matches the MVP's documented single-target-role constraint; commented where to fix if a second role is ever added.
- `src/components/dashboard/evidence-timeline.tsx`: the page's one Client Component (`"use client"`) — holds only the sort-order dropdown's state (Newest/Oldest/Highest/Lowest Score) and re-sorts the already-fetched evidence array in the browser, no refetch. Mirrors `pri-dial.tsx`'s role as the dashboard's one client island receiving server-fetched data as props. Renders per-item source, evidence type, score/max score, date, valid/expired badge + expiry date, and AI feedback (Strengths/Gaps/Summary, only when `ai_feedback` is present) — never raw JSON.
- `src/components/dashboard/evidence-page-skeleton.tsx`: loading fallback sized to the real header + timeline layout to avoid layout shift, matching the `animate-pulse`/`aria-hidden` convention of the existing three skeleton components.
- `dimension-cards.tsx` now exports `STATUS_LABELS`/`STATUS_BADGE_CLASSES` (previously module-private) so the new page reuses the exact same status vocabulary/colors instead of redefining them.

### Changed
- `src/components/dashboard/dimension-cards.tsx`: each card is now wrapped in a `next/link` to `/dashboard/dimension/{id}`, with an `aria-label` announcing the dimension name and status. No other markup or classes changed.

### Notes
- No database schema changes. Every requested field maps onto existing columns (`evidence_records`, `assessment_results` via `source_id`, `readiness_rules`) via a join; "Valid/Expired" and "Expiry Date" are derived at read time from `evidence_records.created_at` + `readiness_rules.evidence_validity_days` (same cutoff arithmetic as `calculateDimensionStatus`, deliberately duplicated as one line rather than refactoring the exhaustively-tested `readiness-engine.ts` to export it for a display-only purpose), never persisted.
- Verified `getDimensionDetail()` directly against real seeded data (the actual shipped function, called from a throwaway script, not a reimplementation) for three cases: a dimension with real evidence (joins, sort order, valid/expiry computation all correct), a never-assessed dimension (correct empty-state shape), and a nonexistent dimension id (`dimension_not_found`, triggers `notFound()`).
- Additionally verified with a full authenticated browser walkthrough (login → `/dashboard` → dimension card → evidence page → sort → back to dashboard), zero console errors/warnings/failed navigations. This app's PKCE-only login has no route to a real session via the link-click flow without a live email (the implicit-flow hash-fragment workaround was already tried and reverted in Session 7, see `PROJECT_CONTEXT.md`) — real authentication was instead established via `verifyOtp()` with an admin-generated one-time code, a different, directly-callable Supabase Auth mechanism that returns a session in its response body rather than via a redirect, so it isn't subject to that same incompatibility. Done through a temporary, uncommitted test-only route (`src/app/auth/zz-test-login/route.ts`, using only the existing `supabase-server.ts` helper) that was deleted before this commit — not part of Session 10's shipped surface.
- `assessment_results.ai_feedback` was `null` on the test data used for verification (a pre-existing, already-documented condition — see Session 6 in `PROJECT_CONTEXT.md`, "real test blocked by insufficient API credit, not a code issue") — the AI Explanation section's presence/absence logic was exercised via its "not available" branch, not its populated branch.

## [Session 9] — 2026-07-21 (Deployed 2026-07-26)

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
- **Release checkpoint (2026-07-26):** deployed to production. `npm run build`, `npm run test` (18/18), and `npm run lint` reverified clean against commit `5f104a8` at checkpoint time.

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
