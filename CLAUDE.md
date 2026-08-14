# ASCEND Frontend — engineering rules

Engineering partner for a solo, **non-technical** founder working with a small
part-time team. Optimize for shipping working software the founder can see, test
and understand. Every session ends with something that runs.

## What this repo is — and is not

This is the **frontend only**: Next.js (App Router) on Vercel. The backend —
all business logic, scoring, AI calls and database access — lives in the
separate `ascend-backend` repository (TypeScript / Node 22 / Fastify on Render).

**Never add to this repo:** scoring or readiness logic, direct database queries,
the Supabase service-role key, AI SDK calls, or API route handlers that contain
business logic. If a page needs new behaviour, the behaviour is a backend
endpoint; this repo gets the typed call and the UI.

## Requirement authorities

1. **ASCEND Modular Career Journey Product Blueprint** — the requirement doc.
2. **ASCEND MVP Six-Page Narrative** (Time-to-Productivity lens) — the MVP doc.

The MVP's non-goals are binding: browser app only (no native apps, no bottom
tab bar), mobile-responsive from 360 px, autosave on meaningful interactions,
usable on 3G/4G. Never ship fabricated social proof (invented user counts,
ratings, "trusted by" claims) — trust metrics come from real data or don't ship.

## What this product is — the design test

Ascend is a **career companion**, not a hiring platform and not a learning
platform. The difference shows in what a screen opens with: a platform opens
with what it can do for you, a companion opens with where *you* are and what is
worth doing next.

Every screen, every section and every piece of copy must answer three questions,
in this order:

1. **Why should I care?** — the stake, stated before the ask.
2. **Why is this relevant to me?** — drawn from this person's own record. If
   there is nothing to draw on, say that plainly; never invent a reason.
3. **What is my call to action?** — exactly one primary action. Two primary
   actions is the same as none.

`lib/next-step.ts` holds this as a type (`NextStep`), and `NextStepCard`
renders it. A section that asks for something and cannot fill all three fields
has not earned the ask — cut it or find the missing answer.

Two further tests, applied to every design decision:

- **How fast does this convince someone that staying will improve their
  future?** Confidence comes from being specific about what they told us and
  what they chose — never from praise, urgency or invented numbers.
- **Is teal doing its job?** Teal means *you earned this*. Violet means
  *Ascend is guiding you here*. Never mix them.

## Layer rules

```
app/  ──▶  lib/          components/ ──▶ (types only)
```

- `app/` is a routing layer: a page fetches from the backend API (one call per
  page where possible, Supabase JWT attached), maps the response to props, and
  composes components. No business logic in pages.
- `components/` are presentational: props in, JSX out. No fetching, no state
  beyond UI state.
- `lib/` holds the API client, the browser Supabase auth client and dumb
  helpers. Access `NEXT_PUBLIC_*` env vars statically, never dynamically.
- Auth: Supabase in the browser for sessions; the API verifies the JWT
  server-side. 401 from the API → redirect to login. 5xx → friendly retry
  state, never a blank page.

## Locked stack — no substitutions or additions without asking

Next.js App Router + TypeScript strict · Tailwind CSS v4 (hand-written
components — no shadcn/ui) · Supabase JS (auth only) · zod · Vitest · Vercel.

**Forbidden:** component libraries, CSS-in-JS, Redux/heavy state libraries,
third-party trackers, carousel/animation libraries (use CSS), any server-side
data layer in this repo.

## Standards

- TypeScript strict, no `any`.
- Accessibility: keyboard reachable, visible focus, AA contrast, semantic
  landmarks; respect `prefers-reduced-motion`.
- Responsive baseline 360 px; touch targets ≥ 44 px; no horizontal page scroll.
- No placeholder code or TODOs in shipped files — cut scope instead.
- Definition of done: `npm run typecheck && npm run lint && npm test &&
  npm run build` all clean, and the founder has verified the behaviour in a
  browser.

## Communication rules — the founder is non-technical

1. Before coding, state in 2–3 plain sentences what you will build and how he'll
   verify it works.
2. After coding, give exact verification steps ("open this URL, click this, you
   should see X").
3. When something fails, explain the cause in plain language before fixing it.
4. Prefer complete file contents for small files; for large files edit directly
   and summarize what changed.
5. Never bury an architectural decision inside a question — surface trade-offs
   with a recommendation.
