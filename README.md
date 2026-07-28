# GetJobReady.ai — Employability Engine

AI-powered employability platform for frontline workers in India. This repository
holds the MVP: one complete student journey — evidence in, deterministic readiness
status out, employer-visible passport at the end.

Architecture baseline: **ASCEND-ENG-015** (MVP Technical Engineering Blueprint) and
**ASCEND-ARCH-001** (MVP Software Architecture). Working rules: `CLAUDE.md`.
Current state, conventions and session history: `docs/PROJECT_CONTEXT.md`.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

Requires `.env.local`:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and request-scoped clients |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side writes. Never imported client-side |
| `ANTHROPIC_API_KEY` | Claude. Unused until the AI gateway ships |
| `ADMIN_BOOTSTRAP_USERNAME` · `ADMIN_BOOTSTRAP_EMAIL` | The break-glass admin — see `modules/identity/README.md` |
| `NEXT_PUBLIC_SITE_URL` | Optional. Origin for OAuth and password-reset links; derived from request headers when unset |

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run typecheck` | `tsc --noEmit` — zero type errors required |
| `npm run lint` | ESLint |
| `npm test` | Vitest — the readiness engine is tested exhaustively |
| `npm run build` | Production build |

CI (`.github/workflows/ci.yml`) runs those four checks on every pull request.

## Status: the front door works

The repository was **reset on 2026-07-27** — the previous implementation predated the
finalised MVP and had no enforced module boundaries, so it was removed rather than
retrofitted. It is intact on `main` (`git checkout main -- <path>`) and documented in
`docs/CHANGELOG.md`.

**Built:** the public homepage, the whole authentication journey — sign up, sign in
with email-or-username and password, Google SSO, password reset, role-based landing
for students, admins and employers — and the admin console's user management:
search everyone who has signed in, change their role, and invite employers.
`modules/identity` owns it; migrations `0001` and `0003` cover `user_account`.

**Not built:** the other nine modules. `/dashboard`, `/admin` and `/portal` are real,
protected pages with honest empty states, not stubs with invented data.

**The pre-reset schema is still live in Supabase** — read
`supabase/archive/README.md` before writing the next migration.

## Repository structure

Modular monolith per ASCEND-ENG-015 §12 — domain boundaries as folders in one
Next.js app, one deployment, `git push` to ship.

```
app/          routes only; pages compose modules and hold no business rules
  (public)/   / · /login · /signup · /forgot-password · /reset-password
              /auth/callback   (+ reserved: public passport)
  (student)/  /dashboard  (+ reserved: discovery, pathway, simulations, evidence)
  (admin)/    /admin · /admin/users · /admin/employers/new
  (employer)/ /portal     (+ reserved: consented passport review)
  api/        reserved: machine callers
  auth-actions.ts   sign-out and Google Server Actions, shared by the route groups
modules/      identity is built; the other nine are reserved — student-discovery,
              role-standards, simulations, evidence, readiness, passport,
              employer-review, pilot-metrics, ai-gateway
components/   presentational only; actions arrive as props
lib/          shared plumbing — db/ clients, env.ts, data-result.ts
middleware.ts session refresh + signed-out redirect. Role checks live in each
              route group's layout, which can query the database safely
tests/        unit/identity  (integration/ e2e/ fixtures/ still empty)
supabase/     migrations/0001_identity_user_account.sql; archive/ holds the old schema
scripts/      one-off dev utilities (empty)
docs/         architecture, build guide, data ownership, changelog, history
```

**Route groups.** A folder in parentheses is organisational and is stripped from
the URL: `app/(student)/dashboard/page.tsx` would serve `/dashboard`, not
`/student/dashboard`. They group routes by audience and let each group take its
own layout later.

**Reserved folders.** A folder containing only a `README.md` is part of the
blueprint but not built yet. That README states what the module will own — and what
it must not. Nothing imports it, and it contains no placeholder code.

## The boundaries are enforced, not suggested

`npm run lint` fails on an architecture violation:

| Violation | Why |
|---|---|
| Anything importing from `app/` | `app/` is the outermost layer; nothing may depend on it |
| `@/modules/x/some-internal-file` | modules are imported through their `index.ts` public API only |
| `lib/` importing a module | the dependency runs `modules/ → lib/`, never the reverse |
| A component importing `lib/db/*` | components take props; they never query the database |

**And one rule ESLint can't check, so it's on you:** every table has exactly one
owning module, registered in [docs/data/OWNERSHIP.md](docs/data/OWNERSHIP.md). Other
modules call that module's functions — they never read its tables and never join
across the boundary in SQL. This is the rule the previous implementation broke worst:
four tables ended up read and written from five different places.

## The rules that shape this codebase

1. **Evidence first.** No readiness claim exists without stored, auditable evidence.
2. **AI assists; rules govern.** Claude grades artefacts and drafts feedback.
   `modules/readiness/readiness-engine.ts` — pure, no DB, no AI — decides every
   status, PRI score and passport eligibility. AI output never sets a status.
3. **Version everything material.** `readiness_rules` rows are insert-only with a
   version column; every stored status records the `rule_version_applied` that
   produced it. Every AI call records its model and prompt version.
4. **Audit everything.** Status changes, rule changes and passport publish/revoke
   write to `audit_log` with before/after state.
5. **Passports are frozen snapshots** with revocable share tokens — never live queries.
6. **Consent is explicit and instantly revocable.**
7. **A failing AI call must never block** evidence creation or status recalculation.
