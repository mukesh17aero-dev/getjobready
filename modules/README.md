# modules/ — domain layer

One folder per domain module from ASCEND-ENG-015 §6 / ASCEND-ARCH-001 §2.2.
This is a modular monolith: these are folders in one Next.js app, **not**
separate services.

Rules (ASCEND-ENG-015 §12.1):

- Pages and route handlers compose these modules; they do not contain scoring
  or authorisation logic themselves.
- Each module exposes a small public API and hides its persistence details.
- Business-rule functions are pure where possible and tested with fixed
  fixtures (`tests/unit/`).
- AI may analyse and draft feedback. Deterministic rules govern formal status —
  `modules/readiness/` is the only place a status is decided.

A module folder containing only a `README.md` is reserved, not built. Nothing
imports it yet.
