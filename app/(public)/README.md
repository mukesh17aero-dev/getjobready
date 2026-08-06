# (public) — unauthenticated routes

`page.tsx` is a dependency-free placeholder root route so the app boots.

Reserved for this group: `login/`, `signup/`, `auth/callback`, and the public
passport share page (`passport/[token]`). Authentication uses Supabase in the
browser; everything else talks to the backend API.
