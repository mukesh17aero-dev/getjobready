# ASCEND Frontend

The web frontend for ASCEND — the Talent Fulfillment Network. Next.js (App
Router) on Vercel. All business logic, scoring and data access live in the
separate **`ascend-backend`** repository (TypeScript / Node 22 / Fastify on
Render); this app renders pages and calls that API.

**Status: frontend skeleton only.** This branch (`daniel/mainline`) was reset to
a structure-only baseline so every developer starts from the same layout and
rules. Pages arrive with the first feature commits.

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
the backend API with the session token attached. No database queries and no
service-role key ever exist in this repo.

## Folder map

```
app/          routes only — (public) (student) (admin) (employer) route groups
components/   presentational components: props in, JSX out
lib/          API client, Supabase browser auth client, shared helpers
tests/        unit/ integration/ e2e/ fixtures/
docs/         frontend-specific docs
public/       static assets
```

A folder containing only a `README.md` is reserved, not built.

## Getting started

```bash
npm install
npm run dev       # http://localhost:3000
```

Checks (all must pass before a PR):

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

Environment (`.env.local`, never committed): `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL` (the Render backend URL).

## Governing documents

1. **ASCEND Modular Career Journey Product Blueprint** — the requirement doc.
2. **ASCEND MVP Six-Page Narrative** (Time-to-Productivity lens) — the MVP doc.

Read `CLAUDE.md` before writing any code.
