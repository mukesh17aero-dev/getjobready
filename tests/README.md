# tests/

Test layers per ASCEND-ENG-015 §14. Run with `npm test`.

Currently **empty** — the implementation was reset on 2026-07-27 and its tests went
with it. `passWithNoTests` is set in `vitest.config.ts` so an empty suite does not
fail CI; remove that flag once the first module ships tests, at which point
"no tests found" genuinely means something is broken.

| Folder | Layer |
|---|---|
| `unit/` | Readiness rules, evidence sufficiency, schema validation, state transitions. All critical rule branches automated. |
| `integration/` | Submission transaction, AI job creation, feedback persistence, snapshot generation. Material commands must be idempotent. |
| `e2e/` | Full student loop, two-student RLS isolation, consent and employer preview. Playwright — not installed yet; adding it is a stack change, so raise it first. |
| `fixtures/` | Fixed fictional test data. No production personal data, ever. |

The readiness engine is the audit-safe core: its tests stay exhaustive from the day
it is written, not later.
