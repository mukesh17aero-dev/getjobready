---
name: ship-check
description: Verify an Ascend change is safe to hand over — runs the architecture guard, typecheck, lint, tests and build in whichever repo you are in, and checks the traps that have actually broken this codebase before (sync-conflict copies, dead files, misplaced "use client", behavioural metrics leaking into user-facing copy). Use before telling the founder something is done, and after any refactor or file move.
---

# Ship check

The founder is non-technical and verifies in a browser. "Done" means the gate
is green **and** you can say which URL to open and what should be seen there.

## 1. Clean up what the environment did

This repo lives under `~/Documents`, which iCloud syncs. It leaves stale
copies like `admin-console 2.tsx` beside real files. They get linted, they get
committed by accident, and they are indistinguishable from real files later.

```bash
node scripts/clean-conflicts.mjs        # frontend; runs automatically too
find . -name "* [0-9].ts" -o -name "* [0-9].tsx" | grep -v node_modules
```

Anything that turns up here is deleted, never edited or imported.

## 2. Run the gate

Frontend:
```bash
npm run typecheck && npm run lint && npm test && npm run build
```

Backend:
```bash
npm run typecheck && npm test && npm run build
```

`typecheck` and `build` both run `scripts/check-architecture.mjs` first. Read
its output rather than working around it — each failure names the rule and what
to do instead.

## 3. Prove the routes survived

After any move, delete or split, compare the built route list against what was
there before. This is the single check that catches a deleted page:

```bash
npm run build 2>&1 | sed -n '/^Route (app)/,/^$/p' \
  | sed 's/[├└│─]//g' | awk '{print $2}' | grep '^/' | sort -u
```

The frontend should list **32 real routes**. If a route vanished, stop and say
so — do not carry on.

## 4. Check the traps that have actually bitten

- **`"use client"` must be the first line.** An import above it is a Turbopack
  build error that typecheck does not catch. After any script that inserts
  imports, grep for files where the directive is not on line 1.
- **`TS2786: 'X' cannot be used as a JSX component`** means a component named
  after a DOM global (`Text`, `Option`, `Image`) is missing its import and
  silently resolved to the global. Import it; do not rename the global.
- **Unused imports after a split.** `npx eslint --format json` reports them
  with `messageId: "unusedVar"` and a `data.varName` — use that, not the
  message text, which ends in a period.
- **Dead code.** If you added a page or component to look at something once,
  delete it now. 71 preview routes once shipped to production unnoticed.

## 5. Check nothing leaks that should not

- **Behavioural metrics are never user-facing.** Dwell time, return counts and
  click counts may rank and order things; they must never appear in copy.
  Grep any new user-facing text for "seconds", "times", "visits", "came back".
- **No fabricated numbers** — no invented user counts, ratings or "trusted by".
- **No secrets in output.** Never print the contents of `.env`, `.env.local` or
  `ASCEND_INFRA.md`. Read the variable *names* if you need to check one exists.

## 6. Hand over in plain language

State the URL, the click, and what should appear. Say plainly what you did not
do and what is still broken. Do not commit or push — the founder asks for that
explicitly, because pushing deploys.
