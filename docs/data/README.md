# Data documentation — reserved

Current state lives in `docs/DATABASE_SCHEMA.md` (12 tables, RLS state,
migration history). This folder is reserved for the entity-level
documentation described in ASCEND-ENG-015 §7 as the model grows toward
role_version, competency, attempt, artefact_version, consent_grant,
employer_review and pilot_outcome.

Non-negotiable data rules (§7.2) — submitted artefacts immutable, versions
stored with every attempt, employer views from snapshots only, AI output stored
separately from readiness decisions, consent first-class.
