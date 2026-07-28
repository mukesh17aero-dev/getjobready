# supabase/migrations

The new series starts at `0001`. The previous series is in `supabase/archive/` and
must not be re-applied.

## Naming

```
NNNN_<owning-module>_<what-it-does>.sql
```

e.g. `0001_identity_accounts.sql`, `0004_role_standards_competencies.sql`.

The module name in the filename is not decoration: it is the record of who owns the
tables that migration creates, and it must match an entry in
`docs/data/OWNERSHIP.md`.

## Why one flat folder and not a folder per module

Per ASCEND-ENG-015 §12, and for a reason worth understanding: **the modular monolith
rule is about import dependencies, and a database has none.** It has one namespace
and one timeline. Sorting these files into `identity/`, `evidence/` and so on would
not create isolation — it would only hide the order they must run in, which is the
one thing this folder exists to record. You would then need a manifest to put the
order back, which is the sequence number you started with.

It matters here more than most places because there is no CLI: these are pasted in by
hand, and "top to bottom" has to be unambiguous.

The boundary is enforced by a rule instead — **one migration touches one module's
tables** — and by the module name in each filename.

## Index by module

Keep this current; it is the view a flat folder cannot give you.

| Module | Migrations |
|---|---|
| `identity` | `0001_identity_user_account.sql`, `0003_identity_user_account_scd2.sql` |

There is no `0002`. It was superseded before it was ever applied and deleted rather
than left as a step that exists only to be undone — see `docs/CHANGELOG.md`. A gap in
the numbering is fine; renumbering an applied series never is.

## Rules

- **One migration touches one module's tables.** If a change needs two modules'
  tables, that is two migrations — and probably a sign the boundary is wrong.
- **Never edit an applied migration.** Add the next number.
- **RLS ships with the table.** A migration that creates a student-visible table and
  does not enable RLS *and* add a policy is incomplete. RLS enabled with no policy
  denies everything; no RLS at all exposes everything. Both have happened on this
  project before.
- **Idempotent where practical** (`create table if not exists`,
  `drop policy if exists` before `create policy`) — the founder applies these by
  hand and may re-run one when unsure whether it took.
- **`readiness_rules`-style versioned tables are insert-only.** A threshold change
  inserts `version + 1` and deactivates the prior row. Never `UPDATE`.

There is no Supabase CLI on this project. Every file here is pasted into the
Supabase dashboard SQL Editor by hand, in order. See the `db-migration` skill.
