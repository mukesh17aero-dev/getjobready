# CHANGELOG.md

Technical, commit-level changelog. Format loosely follows [Keep a Changelog](https://keepachangelog.com/). For product-facing summaries see `RELEASE_NOTES.md`; for full architectural context see `PROJECT_CONTEXT.md`.

## [Unreleased] — 2026-07-27: Account history, admin cross-role viewing, preview mode

### Changed — `user_account` is now a Type 2 slowly-changing dimension
`supabase/migrations/0003_identity_user_account_scd2.sql` restructures the table:
`account_id` (per version) replaces `id` as the key, `user_id` identifies the person,
and `is_active` marks the current row. A change closes the old row and inserts a new
one, so no state is ever destroyed.

- **Exactly one active row per person**, enforced by a partial unique index. Email,
  username and the bootstrap flag are likewise unique **only among active rows** —
  without that, every historical row would collide and no change could be recorded.
- **All writes go through `set_user_account_state()`**, a Postgres function doing the
  close-and-open in one transaction. As two round trips from the application, a
  failure in between would leave someone with no active row — and the next request
  would recreate them as a student. An admin could be demoted by a dropped
  connection. It is `SECURITY INVOKER` and execute is revoked from `anon` and
  `authenticated`.
- The function **returns the current row unchanged when nothing material differs**,
  so re-asserting the same details at sign-in does not add a version.
- **There is no `0002`.** It added `role_changed_at` / `role_changed_by`, which this
  migration would immediately have removed — per-version provenance records every
  change, not only the most recent. It was never applied to any database, so it was
  deleted rather than left as a step that exists only to be undone. The numbering
  gap is deliberate.
- `last_sign_in_at` is overwritten in place and never versioned: a Type 1 attribute
  inside a Type 2 dimension. Versioning it would add a row per sign-in.
- **Foreign keys from other modules must reference `auth.users(id)` or `user_id`,
  never `account_id`.** Recorded in `docs/data/OWNERSHIP.md`.

### Changed — admins can view every area
`canViewArea()` replaces the exact-role match. An admin may open `/dashboard` and
`/portal`; students and employers still see only their own. This reverses the
"admins get no master key" decision made earlier the same day, at the founder's
request.

Viewing is not acting: an admin in the student area still has an admin session, and
each area's own rules still apply.

### Added — preview mode
An admin can switch into the student or employer view from a "View as" control in the
header.

- The chosen role lives in an `httpOnly` cookie and can only ever **narrow** what is
  reachable — an admin may already open every area, so previewing removes the admin
  console rather than granting anything. A forged cookie on a non-admin is ignored
  outright and never even read.
- While previewing, `/admin` is genuinely unreachable — otherwise it would not be a
  preview. The exit control is on screen at all times.
- **Every administrative function uses the real role, never the previewed one.** An
  admin previewing as a student can still change roles and invite employers.
- Signing out clears the preview, so the next person on that browser does not
  inherit it.
- An amber bar appears whenever an admin is looking at an area that is not their own
  — whether they used the switcher or simply typed the address.

### Added
- **"Set by" column** on the user list, resolving `created_by` to a name against the
  accounts already fetched, with the date the state took effect. This is the visible
  answer to "who made this person an admin".
- **19 more unit tests** (81 total), covering the view-area matrix, preview
  authorisation, the forged-cookie case, preview not widening administrative
  permissions, sign-out clearing preview, and role changes carrying every attribute
  onto the new version.

## [Unreleased] — 2026-07-27: Admin user management and employer provisioning

### Added
- **`/admin/users`** — everyone who has signed in, searchable by name, email or
  username, with a per-row control to move them between student, admin and employer.
- **`/admin/employers/new`** — creates an employer account and emails an invitation.
  Employers cannot self-register; this is the only way one comes into existence.
- **Admin section navigation**, visible on every `/admin` page.
- **`canChangeRole()`** — a pure rule refusing three cases: the actor is not an
  admin, the actor is the target, or the target is the setup account. The admin page
  renders its controls from this same function rather than deciding for itself.
- ~~**`supabase/migrations/0002_identity_role_provenance.sql`** — `role_changed_at` and
  `role_changed_by` on `user_account`.~~ **Superseded before it was ever applied**, and
  the file deleted — see the entry above. Per-version provenance replaced it.
- **32 more unit tests** (62 total), including a mocked service suite covering the
  authorisation paths: a student cannot promote themselves or anyone else, an admin
  cannot change their own role, the setup account cannot be edited, an unknown role
  is rejected, a no-op writes nothing, and `changedBy` always comes from the session
  rather than the caller.

### Changed
- **The bootstrap admin no longer retires.** Founder's decision, reversing the
  automatic cut-off shipped earlier the same day. `MAX_ADMINS_FOR_BOOTSTRAP_LOGIN`,
  `isBootstrapLoginEnabled()` and `countAdmins()` were **removed**, not left dormant —
  a dead safeguard reads as a live one. The only off-switch is now removing
  `ADMIN_BOOTSTRAP_USERNAME` from the environment, and `/admin` says so.
- Every `user_account` query now logs its underlying Postgres error server-side.
  Returning `null` for both "no row" and "query failed" made a missing table look
  identical to a missing account — the same shape as the Session 8 RLS incident.
- `startGoogleSignIn` pre-flights the authorize URL. A disabled provider used to
  dump Supabase's raw JSON on the user, because the client builds that URL locally
  and never learns it will be refused. Fails open.
- `completeCodeExchange` distinguishes a split identity — an email that already has
  a non-Google account here — from a generic read failure.

### Known gaps
- **No rate limiting of our own** (`lib/security/` still reserved).
- **No general audit log** — role provenance is on the row; `audit_event` arrives
  with `pilot-metrics`.
- **Employer invitations depend on Supabase's built-in email**, which is heavily
  rate-limited on the free tier. Bulk invites will need real SMTP configured.

## [Unreleased] — 2026-07-27: Homepage and authentication (`modules/identity`)

The first module. Nothing else in the platform could gate access until it existed.

**Migration `0001` has not been applied yet** — paste it into the Supabase SQL Editor
before signing in, or every attempt fails on a missing table.

### Added
- **`modules/identity`** — the first built module, and the first row in
  `docs/data/OWNERSHIP.md`. Public API: `getCurrentUser`, `signInWithPassword`,
  `signUpStudent`, `startGoogleSignIn`, `completeCodeExchange`, `sendPasswordReset`,
  `updatePassword`, `signOut`, `authorizeRole`, plus the pure routing rules
  (`homeRouteForRole`, `canAccessRoute`, `postSignInRoute`, `safeNextPath`,
  `isBootstrapLoginEnabled`).
- **`supabase/migrations/0001_identity_user_account.sql`** — `user_account`, keyed on
  `auth.users`. RLS on, `select` own row only, **no write policy**: every write goes
  through the module with the service-role key, so a student cannot promote
  themselves.
- **Public homepage** at `/`, branded *Ascend — Talent Fulfillment Network*.
- **Auth journey**: `/login` (email **or** username + password, and Google SSO),
  `/signup` (students only), `/forgot-password`, `/reset-password`,
  `/auth/callback` — the single return point for Google, email confirmation and
  password-reset links.
- **Three protected areas** with real layouts and honest empty states: `/dashboard`
  (student), `/admin`, `/portal` (employer). Each route group's layout calls
  `authorizeRole`, so a new page under it is protected by existing.
- **The break-glass admin** — one username and password from
  `ADMIN_BOOTSTRAP_USERNAME` / `ADMIN_BOOTSTRAP_EMAIL`, whose password sign-in
  retires permanently once more than two admin accounts exist. Checked *before* the
  password is verified, so a retired password cannot be confirmed as correct by
  watching which error returns.
- **30 unit tests** across the routing rules and the input schemas.

### Changed
- `middleware.ts` gained the signed-out redirect it was holding a place for
  (`/login?next=…`). Role checks deliberately live in the route-group layouts, not
  here: middleware would need the service-role client in the edge bundle.
- `app/globals.css` — dropped the hardcoded Arial and the automatic dark mode, which
  flipped `body` while every Tailwind utility stayed light.
- `app/layout.tsx` — real title and description, replacing "Create Next App".
- `vitest.config.ts` — `passWithNoTests` removed. "No tests found" is now a failure,
  which is the point.

### Decisions worth recording
- **No role selector anywhere.** Sign-up creates students and takes no role
  parameter; sign-in has no dropdown. Role is read from the database server-side on
  every request. Admin and employer accounts are provisioned by an admin.
- **Admins get no master key.** An admin opening `/dashboard` is redirected to
  `/admin` rather than shown a student's view through an admin session.
- **No account enumeration.** Every sign-in failure returns one message, and
  `sendPasswordReset` reports success for unknown addresses. Otherwise both forms
  become tools for checking who is registered here.

### Known gaps
- Admin and employer **provisioning UI is not built**, so no second admin can be
  created yet and the bootstrap retirement rule cannot fire in practice.
- **No sign-in audit trail.** Those events belong in `audit_event`, owned by
  `pilot-metrics`, which does not exist.
- **No rate limiting of our own.** `lib/security/` is still reserved; Supabase's own
  auth limits apply in the meantime.

## [Reset] — 2026-07-27: Strict modular monolith, implementation removed

The codebase predated the finalised MVP. Rather than retrofit boundaries onto code
that had none, the implementation was removed and the repository reduced to an
enforced architectural skeleton. **Everything deleted here is intact on `main` and on
`origin/main`** — `git checkout main -- <path>` restores any of it.

### Removed
- All feature code: student dashboard and evidence drill-down, admin console and its
  Server Action, login and the two auth route handlers, the assessment intake API,
  every domain file in `modules/`, all 11 components, both test files, and the three
  schema-bound scripts. 28 commits' worth of implementation, all authored by
  Mukesh Krishna.
- `supabase/schema.sql`, the three migrations and `seed.sql` moved to
  `supabase/archive/`. **They are still live in the Supabase project** — archiving a
  file changes nothing in the database. See `supabase/archive/README.md`.

### Kept
- Platform plumbing that encodes no product decision: `lib/db/*` clients,
  `lib/env.ts`, `lib/data-result.ts`, `app/layout.tsx`, `app/globals.css`.
- `middleware.ts`, reduced to session refresh only. Its authorisation branch was
  removed with `modules/identity` — a redirect to `/login` would now point at a route
  that does not exist. The matcher lists the prefixes that will need a session.
- The full folder structure, every reserved `README.md`, and all documentation.

### Added
- **Enforced boundaries** in `eslint.config.mjs`. `npm run lint` now fails on:
  anything importing from `app/`; deep imports into another module
  (`@/modules/x/internal`); `lib/` importing a module; a component importing
  `lib/db/*`. Verified by linting deliberate violations — all four rules fire.
- `docs/data/OWNERSHIP.md` — the table-ownership register. Every table gets exactly
  one owning module; other modules call that module's functions rather than its
  tables, and no query joins across a module boundary.
- Per-module migration convention (`NNNN_<module>_<description>.sql`), documented in
  `supabase/migrations/README.md`. RLS ships in the same migration as its table.
- A dependency-free placeholder at `app/(public)/page.tsx` so `npm run dev` boots.
- `passWithNoTests` in `vitest.config.ts` so the empty suite does not fail CI.
  Remove it when the first module ships tests.

### Verified
`npm run typecheck`, `npm run lint` and `npm run build` all clean; the build serves
`/` and `/_not-found`. `npm test` passes with no tests by design.

### Open
- The live database and `supabase/migrations/` now disagree by design. Before the
  first migration, each legacy table must be explicitly reused, replaced or retired.
- No module has an `index.ts` yet — the deep-import rule is enforced but has nothing
  to guard until the first module ships one.

---

> **Everything below describes the pre-reset implementation.** Those file paths no
> longer exist. Kept for the reasoning, not the paths — the RLS incidents, the auth
> dead-ends and the *why* behind past choices are worth reading before repeating them.

## [Session 12] — 2026-07-27: Repository Restructure — ASCEND-ENG-015 Modular Monolith

No behavioural change. `npm run build` produces the identical 9-route table, all 18 tests pass, lint and `tsc --noEmit` are clean. **Entries in earlier sessions below still refer to the old paths — they are a historical record and were deliberately not rewritten. Use the mapping here to translate them.**

### Changed
- Dropped the `src/` wrapper; `app/`, `modules/`, `lib/`, `components/` and `middleware.ts` now sit at the repository root, per ASCEND-ENG-015 §12. `tsconfig.json` alias updated: `@/*` → `./*` (was `./src/*`).
- `app/` routes grouped by audience with Next.js **route groups**: `(public)`, `(student)`, `(admin)`, `(employer)`. Parentheses are stripped from the URL, so **no route changed** — `app/(student)/dashboard/page.tsx` still serves `/dashboard`. Verified against the bundled Next 16 docs (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route-groups.md`) and by diffing the build's route table before and after.
- New `modules/` domain layer. File moves:

  | Was | Now |
  |---|---|
  | `src/lib/admin-auth.ts` | `modules/identity/admin-access.ts` |
  | `src/lib/onboard-student.ts` | `modules/identity/onboarding.ts` |
  | `src/lib/readiness-engine.ts` | `modules/readiness/readiness-engine.ts` |
  | `src/lib/dashboard-data.ts` | split → `modules/readiness/readiness-data.ts` + `modules/evidence/evidence-data.ts` |
  | `src/lib/admin-data.ts` | `modules/role-standards/dimensions.ts` |
  | `src/lib/ai-evaluator.ts` | `modules/ai-gateway/evaluator.ts` |
  | `src/lib/supabase-{admin,server,browser}.ts` | `lib/db/supabase-{admin,server,browser}.ts` |
  | `src/lib/*.test.ts` | `tests/unit/*.test.ts` |
  | `supabase/seed.sql` | `supabase/seed/seed.sql` |

- `dashboard-data.ts` split along the §6 module boundary: Readiness owns status/PRI/next-action reads, Evidence owns the artefact drill-down. Function bodies are unchanged; only their file and the imports changed.
- `DataResult<T>` extracted to `lib/data-result.ts` — three modules return it, so it belonged to none of them. Previously `modules/role-standards/dimensions.ts` imported it from `dashboard-data.ts`.

### Added
- `README.md` at the repository root: rewritten from the `create-next-app` default into a real project map.
- `README.md` in each reserved (not-yet-built) folder, stating what that module owns and does not own per ASCEND-ENG-015 §6. Git cannot track an empty directory and this project's standing rule forbids placeholder *code*, so the reservation is documented in Markdown, which cannot break a build: `modules/{student-discovery,simulations,passport,employer-review,pilot-metrics}/`, `app/(student)/{discovery,pathway,simulations/[simulationId],evidence,passport}/`, `app/(employer)/review/[snapshotId]/`, `lib/{auth,validation,logging,security}/`, `tests/{integration,e2e,fixtures}/`, `supabase/policies/`, `docs/{adr,api,data,product-traceability}/`.
- `.github/workflows/ci.yml` — the §13.1 pull-request pipeline: install from lockfile → typecheck → lint → unit tests → production build. The build step uses placeholder Supabase env values (several modules read env at import time; the build makes no network calls) — never real keys.
- `npm run typecheck` (`tsc --noEmit`) in `package.json`.

### Not done (deliberate)
- The 336-line 10-step flow in `app/api/assessments/route.ts` was **not** lifted into a domain module, even though §11 says business rules belong in domain services rather than routes. It has no automated test, so moving it would be an unverifiable refactor. Flagged as the next structural step, to be done alongside an integration test.
- `middleware.ts` was not renamed to `proxy.ts`. Next 16 emits a deprecation warning for the `middleware` convention on every build; this pre-dates the restructure and is tracked separately.

---

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
