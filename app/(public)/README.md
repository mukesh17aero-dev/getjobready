# (public) — unauthenticated routes

`page.tsx` is a dependency-free placeholder root route so the app boots.

Reserved for this group: `login/`, `auth/callback`, `auth/signout` — all backed by
`modules/identity/`. The public passport page (`passport/[token]`) also lands here,
backed by `modules/passport/`.
