# Table ownership map

**Every table belongs to exactly one module. Only that module may read or write it.**

This file is the register. A table that is not listed here does not exist as far as
the architecture is concerned — adding a table means adding a row here in the same
change.

## The rule

| | |
|---|---|
| **Owner reads and writes its own tables** | directly, through `lib/db/*` clients |
| **Another module needs that data** | it calls the owner's exported function. It does **not** query the table. |
| **A page or route needs data from two modules** | it calls both modules and combines the results in `app/`. It does **not** join across the boundary in SQL. |
| **Two modules keep needing each other's tables** | the boundary is wrong. Move the responsibility; do not add a shortcut. |

### Why no cross-module joins

A SQL join across two modules' tables is a compile-time-invisible dependency: it
binds one module to the other's column names and will break silently when the owner
refactors. Calling `roleStandards.getDimension(id)` breaks loudly, in TypeScript,
at the call site.

**The cost is real** — two queries where one join would do. At pilot volume
(30–50 students) that is irrelevant, and the ownership boundary is worth more than
the round trip. If a specific read ever does become a measured bottleneck, the fix
is a database view **owned by one module** and exposed through its public API — not
an ad-hoc join in a page.

## Register

| Table | Owning module | Migration | Student-visible (RLS) |
|---|---|---|---|
| `user_account` | `identity` | `0001_identity_user_account.sql`, `0003_identity_user_account_scd2.sql` | Yes — `select` own **active** row only. No write policy: all writes go through the module with the service-role key. |

### `user_account` is a Type 2 slowly-changing dimension

A change does not overwrite a row. The current row is closed (`is_active = false`,
`updated_at`, `updated_by`) and a new one is inserted, so every state a person has
ever been in is still there.

| Column | Meaning |
|---|---|
| `account_id` | Surrogate key — one per **version** |
| `user_id` | The person — one per **human**, references `auth.users` |
| `is_active` | Exactly one `true` per `user_id`, enforced by a partial unique index |
| `created_at` / `created_by` | When this version took effect, and who caused it |
| `updated_at` / `updated_by` | When it was superseded, and by whom. `NULL` while active |

So the active row's `created_by` answers "who put them in this state", and the closed
rows are the history behind it.

**Two things that follow, and matter for every module built after this one:**

- **Foreign keys point at `auth.users(id)` or at `user_id` — never at `account_id`.**
  A student's evidence belongs to the person, not to the version of their account
  that happened to be active when they submitted it.
- **Every read filters `is_active`.** History rows are real rows, and an unfiltered
  query returns one person several times.

Writes go through `set_user_account_state(...)`, a Postgres function that closes and
opens in a single transaction, and returns the current row unchanged when nothing
material differs. Two round trips from the application could leave someone with no
active row at all — and the next request would recreate them as a student.

`last_sign_in_at` is the deliberate exception: overwritten in place, never versioned.
A Type 1 attribute inside a Type 2 dimension. Versioning it would add a row per
sign-in and bury every real change.

## Planned ownership

The intended assignment as modules are built, from ASCEND-ENG-015 §7.1. Nothing here
is committed until the migration exists and the row moves into the register above.

| Module | Tables it will own |
|---|---|
| `identity` | `user_account`, `student_profile`, consent baseline |
| `student-discovery` | `discovery_assessment`, `discovery_attempt` |
| `role-standards` | `role`, `role_version`, `competency`, `role_competency`, `simulation_version`, `rubric_version` |
| `simulations` | `simulation`, `attempt`, `artefact_version`, `resource_declaration` |
| `ai-gateway` | `feedback_job`, `feedback_record` |
| `evidence` | `evidence_record` |
| `readiness` | `student_competency_state`, `readiness_decision` |
| `passport` | `passport_snapshot`, `consent_grant` |
| `employer-review` | `employer_review` |
| `pilot-metrics` | `pilot_outcome`, `product_event` |

## Two tables that are deliberately shared

`audit_event` and `readiness_events` are append-only logs that every module writes to.
They are **not** an exception to the rule — they get an owning module
(`pilot-metrics`) that exposes a write-only helper. Modules call
`recordAuditEvent(...)`; they do not `insert` into the table themselves. Reads are
owner-only.

This matters more than it looks: the audit trail is the evidence that a readiness
claim is defensible. Scattered inserts with inconsistent shapes destroy that, and
the previous implementation had exactly that problem — `audit_log` was written from
two unrelated route files with hand-built payloads.

## Legacy

The pre-reset database (still live, documented in `docs/DATABASE_SCHEMA.md`, SQL in
`supabase/archive/`) has **no** owning module for any table. That is what this
register exists to prevent. Each legacy table must be explicitly reused, replaced or
retired as the modules that need it are built — see `supabase/archive/README.md`.
