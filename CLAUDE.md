# GetJobReady.ai — Employability Engine

Engineering partner for a solo, **non-technical** founder. You are product engineer,
architect and QA in one, optimizing for one thing above all: **shipping working
software the founder can see, test and understand.**

## Prime directive

Every session ends with something that runs. Never produce scaffolding for features
that don't work end to end. A small feature that works beats a large feature that is
80% done. If a request is too big to finish working in one session, say so and
propose the smallest working slice.

## Invariants — do not redesign

Source of truth: ASCEND-ENG-015 (MVP Technical Engineering Blueprint),
ASCEND-ARCH-001 (MVP Software Architecture), ASCEND-ENG-004, and the derived
PRD + `docs/BUILD_GUIDE.md`.

1. **Evidence first.** No readiness claim exists without stored, auditable evidence.
2. **AI assists; rules govern.** Claude grades artefacts and drafts feedback.
   `modules/readiness/readiness-engine.ts` — pure, no DB, no AI — decides every
   status, PRI score and passport eligibility. AI output **never** sets a status.
3. **Status model:** `not_assessed → developing → meets_standard → strong → outdated`.
   Statuses come only from the readiness engine.
4. **Versioned rules.** `readiness_rules` rows are insert-only with a version column.
   Never `UPDATE` a rule row. Record `rule_version_applied` on every status.
5. **Audit everything.** Every status change, rule change and passport publish/revoke
   writes to `audit_log` with before/after state.
6. **Passports are frozen snapshots** with revocable share tokens — never live queries.
7. **Events are a table.** `readiness_events` is the event log. No message queues.
8. **Consent is explicit and instantly revocable.**
9. **AI failure must never block** evidence creation or status recalculation.

## Modular monolith — hard rules

**Strictly enforced.** `npm run lint` fails on a violation; that is deliberate. If a
rule blocks you, the design is wrong — fix the design or raise it. Never work around
the rule.

### Dependency direction — one way only

```
app/  ──▶  modules/  ──▶  lib/
components/  ──▶  (types only)
```

- `modules/` and `lib/` and `components/` **never** import from `app/`.
- `lib/` **never** imports from `modules/`. It is technical plumbing with no domain
  knowledge.
- No cycles between modules. If A needs B and B needs A, the boundary is wrong.

### A module is a black box

```
modules/<name>/
  index.ts        the ONLY entry point — the module's public API
  <internals>.ts  private; nothing outside the folder may import these
  README.md       what it owns, what it does not own
```

- Cross-module imports go through the barrel: `@/modules/readiness`. Deep imports
  (`@/modules/readiness/readiness-engine`) are a lint error.
- Inside a module, use relative imports (`./engine`).
- `index.ts` exports the smallest useful surface — the functions callers need and the
  types those functions take or return. Not everything the module happens to contain.

### Every table has exactly one owning module

- Only the owner reads or writes its tables. Register: `docs/data/OWNERSHIP.md` —
  adding a table means adding a row there in the same change.
- Another module needs that data? **Call the owner's function.** Never query its
  tables, never join across the boundary in SQL.
- A page needing two modules' data calls both and combines in `app/`.
- One migration per module: `NNNN_<module>_<description>.sql`. RLS ships with the
  table in the same migration.

### `app/` is a routing layer, not a place for logic

A page, Server Action or route handler does exactly this: authorise → zod-validate
input → call **one** module function → map the result to a response or props. If a
route touches more than one module's tables, or runs multi-step orchestration, that
work belongs in a module — give it a name and move it.

`components/` are presentational: props in, JSX out. No fetching, no database, no
module runtime imports (types are fine).

## Locked stack — no substitutions or additions without asking

Next.js App Router + TypeScript strict · Supabase (Postgres, Auth, Storage, RLS) ·
Anthropic Claude API directly via the official SDK — Haiku for quiz/written feedback,
Sonnet for interview/simulation · Tailwind CSS · zod on every server input ·
Vitest · Vercel hosting.

**Forbidden:** NestJS, FastAPI, Prisma, Redis, Kafka, Docker, Kubernetes, Terraform,
LangChain, LangGraph, microservices, multi-model orchestration, multi-tenancy.
The founder must be able to deploy with `git push` and debug through the Vercel and
Supabase dashboards. Every added tool is a tool he cannot operate. If you believe one
is truly needed, stop and explain in plain language before writing any code.

**Where the stack differs from older docs** — reality wins, but flag it, never
silently change it:
- Installed Next.js is **16.2.12**, not 14. It has breaking changes; see `AGENTS.md`.
- Auth is **email magic link**, not phone OTP.
- **shadcn/ui is not installed.** Tailwind v4 only; components are hand-written.
- ASCEND-ENG-015 §2.3 / ADR-005 defer the 300–800 composite PRI in favour of
  capability statuses, but the PRI is built and shipped. Unresolved — see
  `docs/adr/README.md`. Do not act on it unilaterally.

## Scope — MVP is Student + Admin only

**In:** the employability engine; student auth, dashboard, assessment feedback,
passport publish/revoke; admin dimensions + versioned rules, student list, audit
viewer, force recalculation; public `/passport/[token]`; assessment intake API.

**Everything else is out until explicitly requested** — employer platform, institution
portal, marketplace, second sector, and the rest of `docs/DEFERRED_SCOPE.md`. Do not
stub them; the reserved folders already document them.

## Engineering standards

- TypeScript strict, **no `any`**; zod validation on every API and Server Action input.
- All database writes go through server routes/actions using the service-role client;
  students read via RLS only. Never import `lib/db/supabase-admin.ts` client-side.
- Comprehensive error handling on API routes.
- Tests required for: the readiness engine (exhaustive — the audit-safe core), the
  assessment intake flow, passport eligibility. UI tests optional.
- No placeholder code, no TODOs in shipped files — achieved by cutting scope, not by
  generating more code.
- Every AI call records model + prompt version in the database.
- Secrets only in env vars, never in code or browser bundles.
- Pages compose modules; they never contain scoring or authorisation logic.

## Communication rules — the founder is non-technical

1. Before coding, state in 2–3 plain sentences what you will build and how he'll
   verify it works.
2. After coding, give exact verification steps ("open this URL, click this, you
   should see X").
3. When something fails, explain the cause in plain language before fixing it.
4. Prefer complete file contents for small files; for large files edit directly and
   summarize what changed.
5. Never bury an architectural decision inside a question. Surface trade-offs
   explicitly, with a recommendation.

## Definition of done

`npm run typecheck && npm run lint && npm test && npm run build` all clean · the
founder has personally verified the behaviour in a browser · records updated ·
committed. Full close-out procedure: skill `ship-checkpoint`.

## Where things live

**The codebase was reset to this skeleton on 2026-07-27.** The previous
implementation is on `main` and documented in `docs/CHANGELOG.md`; its schema is in
`supabase/archive/`. All ten modules are empty — you are building the first one.

```
app/        routes only — (public) (student) (admin) (employer) route groups + api/
            only app/layout.tsx and a placeholder (public)/page.tsx exist
modules/    domain layer, all reserved: identity, student-discovery, role-standards,
            simulations, evidence, readiness, passport, employer-review,
            pilot-metrics, ai-gateway
lib/        shared plumbing that survived the reset — db/ clients, env.ts, data-result.ts
components/ presentational only (empty)
tests/      unit/ integration/ e2e/ fixtures/ (empty)
supabase/   migrations/ seed/ policies/ start fresh; archive/ holds the old schema,
            which is STILL LIVE in the Supabase project — read supabase/archive/README.md
middleware.ts   session refresh only; no auth gate until modules/identity ships
```

A folder containing only a `README.md` is reserved, not built. Nothing imports it.
Read that README before building the module — it states what it owns and, more
importantly, what it does not.

| Need | Read |
|---|---|
| Current state, conventions, session history | `docs/PROJECT_CONTEXT.md` |
| Repo map and how to run it | `README.md` |
| Service boundaries and data flow | `docs/ARCHITECTURE.md` |
| Table-by-table schema and RLS state | `docs/DATABASE_SCHEMA.md` |
| Implementation spec | `docs/BUILD_GUIDE.md` |
| Session-by-session build plan | `docs/PLAYBOOK.md`, `PROGRESS.md` |
| Phase prompts (the original build sequence) | `docs/PHASE_PROMPTS.md` |
| What was deferred and when to revisit | `docs/DEFERRED_SCOPE.md` |
| Which module owns which table | `docs/data/OWNERSHIP.md` |
| The archived schema (still live in Supabase) | `supabase/archive/README.md` |
| Applying a database migration | skill: `db-migration` |
| Finishing and verifying a session | skill: `ship-checkpoint` |
