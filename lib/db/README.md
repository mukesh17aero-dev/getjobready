# lib/db

Three Supabase clients, deliberately separate — picking the wrong one is a
security bug, not a style choice.

| File | Key | Respects RLS | Use in |
|---|---|---|---|
| `supabase-browser.ts` | anon | yes | Client Components |
| `supabase-server.ts` | anon, request session cookie | yes | Server Components, Route Handlers |
| `supabase-admin.ts` | **service role** | **no — bypasses RLS** | Server routes, Server Actions and scripts only. Never import into a Client Component. |

All database writes go through server routes using the service-role client;
students read via RLS only.
