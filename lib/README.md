# lib — frontend plumbing

What belongs here (and nothing else):

- `api-client.ts` — the one fetch wrapper for the backend API: attaches the
  user's Supabase JWT, maps 401 to a login redirect, types every response.
- `supabase-browser.ts` — browser Supabase client for authentication only.
  Access `NEXT_PUBLIC_*` env vars statically (`process.env.NEXT_PUBLIC_X`),
  never dynamically.
- Shared formatting helpers with no domain knowledge.

**Never here:** the Supabase service-role key, direct database queries, scoring
or any business logic — all of that lives in the backend repo (`ascend-backend`).
