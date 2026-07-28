---
name: db-migration
description: Write and apply a Supabase database migration for this project. Use whenever a change touches the schema, RLS policies, seed data or readiness_rules — including adding a table or column, changing a policy, or editing a rule threshold. This project has NO Supabase CLI access, so migrations are applied by hand and the procedure is easy to get wrong.
---

# Applying a database migration

**There is no Supabase CLI and no direct database connection on this project.** The
founder applies every migration by pasting SQL into the Supabase dashboard's SQL
Editor. Never write instructions that assume `supabase db push`, `supabase migration`
or `psql`.

## Before writing any SQL

1. **Decide the owning module and record it.** Every table belongs to exactly one
   module — open `docs/data/OWNERSHIP.md` and add the row in the same change. A table
   with no owner is the exact failure this architecture exists to prevent.
2. Read `supabase/archive/README.md`. The pre-reset schema is **still live in the
   Supabase project** even though its files are archived. If your table already
   exists there, decide explicitly: reuse (`alter`), replace (`drop` + `create`, and
   say why), or leave it. Never create a table that silently shadows a live one.
3. Read `supabase/migrations/README.md` for naming, and list the folder to find the
   next number.
4. Migrations are the source of truth for schema **and** RLS policies. If a policy
   changes, it changes in a migration — not in the dashboard UI.

## Writing the migration

Create `supabase/migrations/NNNN_<owning-module>_<description>.sql`, numbered
sequentially. The module name in the filename is the ownership record — it must match
the entry in `docs/data/OWNERSHIP.md`.

**One migration touches one module's tables.** If a change needs two modules' tables,
that is two migrations — and usually a sign the boundary is wrong.

- **Never edit an applied migration.** Add the next one instead.
- Make it **idempotent** where practical (`create table if not exists`,
  `drop policy if exists ... ; create policy ...`, `where not exists` guards on seed
  inserts). The founder may re-run a file when unsure whether it took.
- Open with a comment block: what changed, why, and what breaks if it isn't applied.
- Backward compatible across one release where practical (§13.2).

### Rules that are not negotiable

- `readiness_rules` rows are **insert-only with a version column**. A threshold change
  inserts `version + 1` and deactivates the previous row. **Never `UPDATE` a rule row** —
  it would silently rewrite the basis of every status already computed from it.
- Any table exposed to students needs RLS enabled **and** a policy. RLS enabled with no
  policy denies everything; no RLS at all exposes everything. Both have happened here
  (see the Session 8 incident in `docs/PROJECT_CONTEXT.md`).
- Reference/configuration tables are readable by any client, writable only via the
  service role.
- Writes reach the database only through the **owning module**, using
  `lib/db/supabase-admin.ts`. If a new table needs a student write path, say so
  explicitly — it is a deliberate decision, not a default.
- **No cross-module foreign key implies cross-module querying.** A foreign key across
  a boundary is fine; a `join` across it in application code is not. The other module
  calls the owner's function.

## Handing it to the founder

Give exact, literal steps. He is non-technical:

1. "Open your Supabase dashboard → SQL Editor → New query."
2. "Paste the contents of `supabase/migrations/000N_....sql` and press Run."
3. "You should see `Success. No rows returned`." — state what he should actually see.
4. Give him a verification query or `npx tsx scripts/verify-db.ts`, plus the expected
   output, so he can confirm it worked rather than assume it.

## After it's applied

- Update `docs/DATABASE_SCHEMA.md` — the table entry, its RLS state and the migration
  history table.
- Add a `docs/CHANGELOG.md` entry.
- If the change affects statuses, say plainly whether existing students' statuses are
  now stale and what recalculates them.
