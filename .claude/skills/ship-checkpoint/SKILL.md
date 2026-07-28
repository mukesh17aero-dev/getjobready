---
name: ship-checkpoint
description: Close out a work session on this project — run the full verification pipeline, write the founder's browser verification steps, and update PROGRESS.md, CHANGELOG.md and PROJECT_CONTEXT.md. Use when a feature is finished, when asked to "finish the session", "ship this", or before committing a session's work.
---

# Closing out a session

The founder is non-technical. A session is not done because the code compiles — it is
done when **he** has seen it work.

## 1. Run the full pipeline

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

All four must be clean. Report the real result — if something fails, say so and paste
the output. Never describe a session as complete with a failing check.

For a UI change, also confirm the build's route table is what you expect. Route groups
(`(public)`, `(student)`, `(admin)`, `(employer)`) are stripped from URLs, so a
restructure must leave the route list unchanged.

## 2. Write the founder's verification steps

Literal and clickable — no jargon, no "should be fine":

- The exact command (`npm run dev`) and exact URL to open.
- What to click, in order.
- **What he should see** — the actual text, number or colour on screen.
- What a failure looks like, so he can tell "broken" from "no data yet".

If something genuinely cannot be verified in the browser (an animation in a
backgrounded tab, a PKCE-only login flow), say so plainly and state what was verified
instead. This project has a history of that — see the Session 9 and 10 notes in
`docs/PROJECT_CONTEXT.md`.

## 3. Update the record

| File | What to add |
|---|---|
| `PROGRESS.md` | Tick the session's box. Commit it with that session's code. |
| `docs/CHANGELOG.md` | A new `## [Session N] — YYYY-MM-DD: Title` entry with Added / Changed / Fixed / Removed. Commit-level detail, including *why* a non-obvious choice was made. Earlier entries are history — never rewrite them. |
| `docs/PROJECT_CONTEXT.md` | Only if conventions, constraints or the folder structure actually changed. |
| `docs/RELEASE_NOTES.md` | Only for founder-facing product changes. |
| `docs/DATABASE_SCHEMA.md` | Only if the schema or RLS changed. |

Record known debt and deliberate omissions explicitly. A gap that is written down is a
decision; a gap that isn't is a bug waiting to be rediscovered.

## 4. Commit

Small, single-purpose commit; the message says what changed and why. **Do not push or
deploy unless the founder asks.** Confirm which branch you are on first.

## Definition of done

Pipeline clean · phase tests pass · the founder has personally verified the behaviour
in a browser · records updated · committed.
