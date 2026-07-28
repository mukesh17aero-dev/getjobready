# scripts/

One-off developer utilities, run with `npx tsx scripts/<name>.ts`.

Empty by design. The previous seed/verify/delete scripts were bound to the archived
schema (`supabase/archive/`) and were removed with it; they are recoverable from git
history on `main` if a new script needs the same shape.

A script may use `lib/db/supabase-admin.ts` (service role) because it runs on a
trusted machine, never in a browser.
