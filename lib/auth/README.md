# lib/auth

Reserved (ASCEND-ENG-015 §12) for shared session/authorisation helpers.

Today: authentication is handled by Supabase Auth via `lib/db/supabase-server.ts`,
route protection by `middleware.ts`, and the admin allowlist by
`modules/identity/admin-access.ts`. Nothing lives here yet.
