# (public) — unauthenticated routes

`page.tsx` is a dependency-free placeholder root route so the app boots.

Reserved for this group: `login/`, `signup/`, `auth/callback`. Authentication
uses Supabase in the browser; everything else talks to the backend API.

`passport/[token]/` is the public Passport share page — no account, no
session. It reads a frozen snapshot by its share token; the candidate creates
and revokes that token from their own, authenticated Passport page.
