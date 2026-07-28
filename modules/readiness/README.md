# Readiness

**Owns:** deterministic capability status, critical-risk checks, evidence
sufficiency and next action.
**Does not own:** open-ended AI scoring.

Reserved — not built yet.

This module is the audit-safe core. Its rule functions must be **pure**: no database
calls, no AI calls, no side effects, no imports — so they can be tested exhaustively
against fixed fixtures. Data access lives in a separate file that calls those pure
functions; keep the two apart.

AI output never sets a status. Every stored status records the
`rule_version_applied` that produced it, and rule rows are insert-only.

Tables per `docs/data/OWNERSHIP.md`: `student_competency_state`, `readiness_decision`.
