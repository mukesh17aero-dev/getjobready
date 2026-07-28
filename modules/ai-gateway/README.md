# AI Gateway

**Owns:** provider calls, output schemas, prompt versions, retries, moderation and
usage records.
**Does not own:** readiness policy. It never decides a status.

Reserved — not built yet.

Non-negotiables when it is built:

- A failure (network, auth, rate limit, malformed JSON) returns a typed failure and
  **never throws** — a broken AI call must not block evidence creation or status
  recalculation.
- Every call records model + prompt version in the database.
- Output is validated against a zod schema before anything else sees it.
- No model call is ever made from browser code.

Tables per `docs/data/OWNERSHIP.md`: `feedback_job`, `feedback_record`.
