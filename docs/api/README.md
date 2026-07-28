# API documentation — reserved

The command/query surface is listed in ASCEND-ENG-015 §11. Implemented today:

| Endpoint | Purpose |
|---|---|
| `POST /api/assessments` | Assessment intake — records the result, requests AI feedback, creates evidence, recalculates status + PRI, writes events and audit rows. |
| `GET /auth/callback` | Magic-link / OTP completion and first-login onboarding. |
| `POST /auth/signout` | Session teardown. |

Everything else in §11 (`startSimulationAttempt`, `submitArtefact`,
`queueFeedback`, `publishPassportSnapshot`, `grantEmployerConsent`,
`reviewPassport`, `recordPilotOutcome`, …) is not built yet.
