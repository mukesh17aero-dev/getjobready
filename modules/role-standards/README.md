# Role Standards

**Owns:** role versions, competencies, evidence requirements, scenario briefs and
rubrics — the configuration every other module reads.
**Does not own:** student attempts.

Reserved — not built yet.

This module is the most-read one in the system: readiness, evidence and the admin
console all need its definitions. That makes its public API the highest-leverage
boundary in the codebase — expose explicit getters and keep the tables private.

Tables per `docs/data/OWNERSHIP.md`: `role`, `role_version`, `competency`,
`role_competency`, `simulation_version`, `rubric_version`.
