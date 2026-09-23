# ASCEND Frontend

The web frontend for ASCEND — the Talent Fulfillment Network. Next.js 16 (App
Router) on Vercel. All business logic, scoring and data access live in the
separate **`ascend-backend`** repository (TypeScript / Node 22 / Fastify on
Render); this app renders pages and calls that API.

## Architecture

```
Browser ──▶ Vercel (this app — Next.js, SSR + client hydration)
                │  HTTPS + Supabase JWT (Authorization: Bearer)
                ▼
            Render (ascend-backend — Fastify API)
                │
                ▼
            Supabase (Postgres, Auth, Storage)
```

The browser authenticates with Supabase directly; every data request goes to
the backend API with the session token attached. No database queries, no
service-role key and no AI SDK exist in this repo; the architecture guard fails
the build if any appear.

## Folder map

```
app/          routes only — (public) (student) (admin) (employer) route groups.
              A page fetches, maps the response to props, and composes. No
              business logic.

features/     the unit of ownership: one folder per domain. Each holds its own
              components, API client, copy and sample data, and exposes a
              public surface through features/<name>/index.ts.

              admin · assessment · discovery · interview · job-fit · journey
              passport · profile · resume · shell · simulation · story-bank
              welcome

components/   shared presentational code, no domain knowledge:
                ui/     primitives — dialog, picker, icons, avatar, back-link
                auth/   sign-in, sign-up gate, deep links

lib/          plumbing with no domain knowledge:
                api/    the typed contract with the backend, one file per
                        backend module behind a barrel
                supabase-browser · supabase-server · theme · when · footprints
                hub-memory · audience · rich-text · api-base

scripts/      check-architecture.mjs (the guard) and clean-conflicts.mjs
tests/        unit/ integration/ e2e/ fixtures/
public/       static assets actually referenced by shipping pages
docs/         frontend-specific docs
```

A folder containing only a `README.md` is reserved, not built.

### The rules, and what enforces them

Imports run one way only:

```
app/  ──▶  features/  ──▶  components/  ──▶  lib/
```

- A feature is entered only through `features/<name>/index.ts`. Deep imports
  from outside fail the build. Inside a feature, use relative paths.
- No cycles between features.
- `components/` and `lib/` must never import a feature.
- 800 lines is the ceiling for a new file. Files already over it are listed in
  `SIZE_ALLOWANCE` in the guard and may only shrink.

`scripts/check-architecture.mjs` enforces these and runs before `typecheck` and
`build`. See `AGENTS.md` and `CLAUDE.md`.

## Getting started

```bash
npm install
npm run dev       # http://localhost:3000
```

The backend must be running too: in `ascend-backend`, `npm run dev` (port 8080).

Checks — all must pass before a PR:

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

`npm run check:arch` runs the architecture guard on its own.

Environment (`.env.local`, never committed): `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL` (the Render backend URL).

## Governing documents

1. **ASCEND Modular Career Journey Product Blueprint** — the requirement doc.
2. **ASCEND MVP Six-Page Narrative** (Time-to-Productivity lens) — the MVP doc.
3. **ASCEND Technical Architecture Design** (ASCEND-ARCH-TDX-001) — the
   full-product architecture reference.

Read `CLAUDE.md` before writing any code.
