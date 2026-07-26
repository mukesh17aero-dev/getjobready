# CHANGELOG.md

Technical, commit-level changelog. Format loosely follows [Keep a Changelog](https://keepachangelog.com/). For product-facing summaries see `RELEASE_NOTES.md`; for full architectural context see `PROJECT_CONTEXT.md`.

## [Session 11] — 2026-07-26: Admin — Access Control + Dimensions Config

### Added
- `src/lib/admin-auth.ts`: `isAdminEmail()` — the single place `ADMIN_EMAILS` (comma-separated, trimmed, lowercased) is parsed and checked. Used independently by both `middleware.ts` and the dimensions Server Action, so the two authorization layers can never drift apart by duplicating the parsing logic.
- `src/app/admin/page.tsx`: the dimensions config page. Server Component; re-checks admin authorization independently of middleware (same defense-in-depth convention as `/dashboard`); one `Suspense` boundary around a single consolidated dimensions fetch.
- `src/app/admin/actions.ts`: `updateDimension()`, a `"use server"` Server Action — the first Server Action in this codebase (previous writes went through Route Handlers). Re-checks admin authorization independently (a Server Action is its own request boundary, not just something the page happens to gate). Validates with zod: name non-empty (after trim), weight > 0. Additionally, server-side (not zod, since it needs the full dimension set): rejects duplicate names (case-insensitive) and rejects deactivating the last active dimension (would zero out `calculatePRI`'s weight denominator for every student). Writes via `supabaseAdmin` (service role — `employability_dimensions` has no student/admin write RLS policy, so this authorization check is the only protection on the write path), then inserts one `audit_log` row per successful edit (`actor: 'admin:<email>'`, `action: 'dimension_update'`, before/after state) — mutation before audit insert, so a failed audit write can never describe a change that didn't happen. Validation/authorization failures redirect to `/admin?error=...`, rendered the same way `/login`'s `?error=` param already is.
- `src/lib/admin-data.ts`: `getAdminDimensions()`, same `DataResult<T>` contract as `dashboard-data.ts`. Deliberately does not filter by `active = true` (unlike the student-facing `getDimensionCards`) — an admin must be able to see and reactivate an already-inactive dimension.
- `src/components/admin/dimension-edit-form.tsx`: a plain Server Component form per dimension, bound directly to `updateDimension` via `<form action={...}>` — no Client Component needed for the core edit flow, same pattern already used for logout's `<form action="/auth/signout">`.
- `src/components/admin/admin-page-skeleton.tsx`: loading fallback, same `animate-pulse`/`aria-hidden`/fixed-5-placeholder convention as `dimension-cards-skeleton.tsx`.

### Changed
- `src/middleware.ts`: matcher extended to `["/dashboard/:path*", "/admin/:path*"]`. New branch: authenticated-but-not-admin requests to `/admin/*` redirect to `/dashboard` (not `/login` — they're legitimately signed in, just not authorized for this route). The existing `/dashboard` branch is untouched.
- `.env.local`: `ADMIN_EMAIL` (singular) → `ADMIN_EMAILS` (plural, comma-separated), matching `CLAUDE.md`/`BUILD_GUIDE.md`/`PLAYBOOK.md`'s Session 11 spec unanimously. Nothing read this variable before this session, so this was a clean rename, not a compatibility break — no fallback to the old name was added, deliberately. Vercel's production environment variable has since been renamed to match (founder-completed) and production redeployed successfully.

### Notes
- Scope held to `docs/PLAYBOOK.md`'s Session 11 (access control + dimensions config only) rather than `CLAUDE.md`'s broader Phase 4 bundle (which also includes the rules editor, student list, and audit viewer) — consistent with every prior session's narrower per-session scoping. Rules editor is Session 12, student list/audit viewer is Session 13.
- Verified end-to-end against real seeded data in a local production build: admin-granted access (dimensions render, editable), non-admin redirect to `/dashboard`, a full edit-and-audit-log cycle (`Digital Skills` weight 1 → 1.1, confirmed in both `employability_dimensions` and a new `audit_log` row, then reverted), server-side rejection of an empty name (bypassing the client-side `required` attribute deliberately, to reach the actual zod check), a duplicate-name rejection, and the last-active-dimension guard (all 5 dimensions were temporarily reduced to 1 active, the guard correctly blocked deactivating the last one, then all 5 were restored to their original values — verified byte-for-byte against a baseline recorded before testing). Done via a temporary, uncommitted local test-login route (same `verifyOtp()` + admin-generated-OTP technique as Session 10's verification), deleted before commit.
- This shares the same live Supabase project as production (`employability_dimensions` and `audit_log` are not environment-scoped), so the verification above was run with care to leave real reference data exactly as found — confirmed via a before/after diff, not assumption.

## [Session 10] — 2026-07-26: Evidence Drill-Down (Deployed 2026-07-26)

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
