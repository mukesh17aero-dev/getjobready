# Architecture Decision Records — reserved

One ADR per material choice that changes data, security, AI or deployment
boundaries (ASCEND-ENG-015 §12.1). The register in Appendix A lists the
baseline set to write up:

| ADR | Decision | Status |
|---|---|---|
| ADR-001 | One Next.js TypeScript modular monolith for MVP | Proposed |
| ADR-002 | PostgreSQL / Auth / Storage through Supabase | Proposed |
| ADR-003 | Vercel preview and production deployments | Proposed |
| ADR-004 | AI feedback is structured and versioned; deterministic rules govern readiness | Locked principle |
| ADR-005 | Competency statuses, not a global PRI score | Proposed MVP baseline |
| ADR-006 | Student discovery precedes the role simulation pathway | Locked product requirement |
| ADR-007 | Behavioural telemetry is research-only, excluded from employer decisions | Proposed safety baseline |
| ADR-008 | One role / one sector built deeply before second-slice expansion | Locked execution baseline |

Note ADR-005 is unresolved against the current build, which implements a
300–800 PRI. See the repository README.
