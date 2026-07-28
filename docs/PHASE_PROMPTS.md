# PHASE_PROMPTS.md

The original six build prompts from the v1.0 master prompt, kept verbatim as the
record of how this codebase was sequenced. They were designed to be pasted one at a
time, in order. Moved out of `CLAUDE.md` because they are one-time build instructions,
not standing rules — five of the six are already shipped.

Day-to-day sequencing now runs off `docs/PLAYBOOK.md` (18 sessions) and `PROGRESS.md`.

| Phase | Status |
|---|---|
| 1 — Schema + Rules Engine | Shipped (Sessions 2–4) |
| 2 — Assessment Intake + AI Feedback | Shipped (Sessions 5–6) |
| 3 — Student Dashboard | Shipped (Sessions 7–10) |
| 4 — Admin Panel | Partly shipped (Session 11: access + dimensions config). Versioned rules editor, student list and audit viewer remain — Sessions 12–13 |
| 5 — Passport | Not started — Sessions 14–15 |
| 6 — Module Integration | Not started — Session 17 |

---

## Phase 1 — Schema + Rules Engine

"Set up the Supabase schema and seed data from the Build Guide (Part 2.3). Then
implement /lib/readiness-engine.ts per the spec in Part 2.4: pure functions, no DB, no
AI. Write Vitest tests covering: zero evidence → not_assessed; only-expired evidence →
outdated; score 78 with 2 valid items, threshold 70 → meets_standard; score 90 with 3
items, strong threshold 85 → strong; unverified evidence is ignored; PRI maps all-zero
→ 300 and all-100 → 800; passport eligible only when every dimension is meets_standard
or strong. Show me how to run the tests and what passing output looks like."

> As built, this lives at `modules/readiness/readiness-engine.ts` with its tests at
> `tests/unit/readiness-engine.test.ts` (the repository was restructured in Session 12;
> see `docs/CHANGELOG.md` for the full path mapping).

## Phase 2 — Assessment Intake + AI Feedback

"Implement POST /api/assessments per the 10-step flow in Build Guide Part 2.6, with the
AI evaluator from Part 2.5 (Haiku for quiz/written_task, Sonnet for
mock_interview/simulation; JSON contract with raw_score, strengths, gaps,
student_summary, improvement_action; store ai_prompt_version). AI failure must not
block steps 4–9. Then give me three curl commands that walk one test student from
not_assessed to developing to meets_standard, and tell me which Supabase tables to
check after each."

> As built: `app/api/assessments/route.ts` and `modules/ai-gateway/evaluator.ts`.

## Phase 3 — Student Dashboard

"Build Supabase phone-OTP auth and the student dashboard: PRI dial (300–800),
dimension status cards with color-coded badges, evidence count, a Next Best Action card
from recommendations, and /dashboard/dimension/[id] showing the evidence list with
dates and scores. Mobile-first, GJR purple design system. Read the frontend-design
conventions before styling."

> Shipped with **email magic-link** auth, not phone OTP — phone OTP was never wired up.

## Phase 4 — Admin Panel

"Build /admin protected by an ADMIN_EMAILS env allowlist: dimensions editor, versioned
rules editor (Save inserts version+1, never updates; offer 'Recalculate all students'),
student list with PRI and statuses, and per-student audit log view. Verify: change a
threshold 70→75, recalculate, confirm statuses shift and audit_log recorded
before/after."

> Session 11 shipped the allowlist + dimensions editor only. The versioned rules
> editor, student list and audit viewer are still open.

## Phase 5 — Passport

"Implement passport publish (eligibility check + consent checkbox + frozen
snapshot_data + share token), the public /passport/[token] page (name, role, PRI,
dimension statuses, evidence summaries as counts and dates — never raw submissions,
'Verified by GetJobReady' badge), and revoke (page must 404 after). Verify in an
incognito window."

> Reserved: `modules/passport/`, `app/(student)/passport/`.

## Phase 6 — Module Integration

"For each existing GJR engine (simulation, interview, quiz, written tasks, profile),
wire its completion handler to POST /api/assessments with the correct dimension_id and
assessment_type per the mapping table in Build Guide Phase 6. One module at a time;
verify each updates readiness before starting the next."

> Reserved: `modules/simulations/`, `app/(student)/simulations/[simulationId]/`.
