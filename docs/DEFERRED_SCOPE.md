# DEFERRED_SCOPE.md

What is deliberately not being built, and the trigger that reopens each one.
**These are sequencing decisions, not rejections.** The architecture — evidence store,
versioned rules, event log, audit trail, consent records — is designed so each can be
added without rework.

Merged from the v1.0 master prompt (moved out of `CLAUDE.md`) and ASCEND-ENG-015 §20.

## Product scope

| Deferred | Reopen when |
|---|---|
| Employer platform / portal | First paying employer pilot confirmed |
| Institution portal | Second institutional customer |
| Second role or sector (e.g. Retail Operations Associate) | The first slice produces stable completion, evidence trust and operational reliability |
| Open talent marketplace / job board | At least two employers repeatedly request candidate discovery **and** commercial terms are validated |
| Full passport portability | The employer evidence format and consent model are trusted in pilot |
| Behavioural archetypes / personality labelling | Signals are normalised, ethically reviewed and validated against real outcomes — currently prohibited (ADR-007) |
| Composite PRI score | ASCEND-ENG-015 defers this pending calibrated, interpretable thresholds and error analysis. **Note: the PRI is already built and shipped here** — this conflict is unresolved, see `docs/adr/README.md` |
| Voice / video AI interview | The text and work-sample loop is validated and voice materially improves prediction or learning |
| Copilot | Post-hire users and employers confirm an execution-support need |
| Intelligence Cloud / cross-cohort analytics | Sufficient cross-cohort employer data exists to be meaningful |
| Coding assessments, achievement wallet, certifications, campus hiring | Not requested by the pilot |
| Feature flags, multi-language, native apps | Web product validated first |

## Technical scope

| Deferred | Reopen when |
|---|---|
| Multi-model AI orchestration (OpenAI/Gemini/router) | The Claude API becomes a proven cost or quality bottleneck |
| Kafka / Redis / any event bus | `readiness_events` table processing measurably lags |
| Separate NestJS/FastAPI backend | Never, unless an enterprise client mandates it |
| Microservices | Team scale, load, isolation or deployment independence creates a **measured** need |
| Docker / Kubernetes / Terraform | A client requires self-hosting |
| Azure migration | Enterprise/customer, compliance, cost or operational evidence justifies it — not before product validation |
| Multi-tenancy | Second institutional customer |
| Blue-green deploys | Never — Vercel preview → promote already provides this |
| 95% coverage, load tests, contract tests | Post-pilot, pre-scale. The readiness-engine tests stay exhaustive from day one regardless |
| SOC 2 / ISO 27001 programmes | First enterprise security questionnaire. RLS, encryption, audit log and consent already cover the substance |
| Native mobile app | Web usage evidence justifies it |

## What cannot be claimed at 90 days

Guardrails from ASCEND-ENG-015 §19.3 — do not let product copy, a dashboard label or a
passport page imply any of these:

- That the PRI predicts productivity, unless real post-hire outcome data exists.
- That click speed or option toggling reveals personality or workplace behaviour.
- That a fresher is ready for Store Manager or Customer Support Manager responsibilities.
- That GetJobReady guarantees employment, performance or lower attrition.
- That the product is ready for multiple sectors merely because the software is configurable.
