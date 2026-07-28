# supabase/archive — the pre-reset schema

**These files are history. Do not apply them, do not edit them, do not import them
into a new migration.**

They describe the 12-table schema built across Sessions 2–11 and repaired in
`0003_complete_database_repair.sql`. The implementation they backed was removed on
2026-07-27 when the codebase was reset to the ASCEND-ENG-015 modular-monolith
baseline.

## The live database still has these tables

Archiving a file changes nothing in Supabase. Your project still contains every
table, policy and seed row described here. Before the first new migration runs,
decide explicitly:

- **Reuse** — the new module keeps an existing table; write its migration to
  `alter` rather than `create`, and note it in `docs/data/OWNERSHIP.md`.
- **Replace** — drop the old table in a numbered migration that says why.
- **Leave** — the table stays, unused and unowned. Acceptable only if written down;
  an unowned table is exactly what the ownership rule exists to prevent.

`docs/DATABASE_SCHEMA.md` documents these tables in detail and remains accurate
about the live database.

## Why the reset

The old schema grew table-by-table alongside features. Nothing recorded which
module owned which table, so by the end four tables were being read and written
from five different places. The new series fixes the cause: one migration per
module, one owner per table.
