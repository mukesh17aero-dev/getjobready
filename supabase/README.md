# supabase/

Migrations are the source of truth for schema and RLS policies. There is no Supabase
CLI on this project — every file is applied by hand in the dashboard SQL Editor, in
order. See the `db-migration` skill.

| Path | Contents |
|---|---|
| `migrations/` | Per-module series. `0001` and `0003` — both `identity`. |
| `seed/` | Per-module reference data. Empty. |
| `policies/` | Reserved. Every policy currently ships inside its table's migration. |
| `archive/` | The pre-reset schema, migrations and seed. **Do not apply.** |

## What lives here, and what does not

This folder holds **schema**: tables, indexes, policies, functions — everything that
defines the shape of the database. The module name in each filename is the ownership
record.

It does **not** hold queries. Reads and writes live in the owning module's TypeScript
(`modules/identity/user-account-repo.ts` and nowhere else), because a query is how a
module uses its own data. A shared `supabase/queries/` folder would be importable by
anything, and the ownership boundary would be gone the first time another module
found a query there that nearly did what it wanted. That is precisely how the
pre-reset codebase ended up with four tables written from five places.

The one exception is deliberate: `set_user_account_state()` is a Postgres function
because closing one row and opening another has to be a single transaction, which the
application cannot guarantee across two round trips.

## Read this before writing the first migration

The archived schema is **still live in your Supabase project** — archiving files
changed nothing in the database. Every legacy table must be explicitly reused,
replaced or retired. See `supabase/archive/README.md` and `docs/data/OWNERSHIP.md`.

## The two rules that matter most

- **One owning module per table**, recorded in `docs/data/OWNERSHIP.md`, reflected in
  the migration filename (`NNNN_<module>_<description>.sql`).
- **RLS ships with the table.** A student-visible table created without RLS enabled
  *and* a policy is an incomplete migration. RLS with no policy denies everything;
  no RLS exposes everything. Both have happened here before.
