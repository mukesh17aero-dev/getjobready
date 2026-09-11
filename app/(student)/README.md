# (student) — signed-in student routes

Reserved for the five persistent destinations from the Blueprint:

- `home/` — adaptive home / Outcome Router surface
- `discover/` — Career Worlds, role compare, role matches
- `practice/` — role readiness assessment and simulation missions
- `passport/` — journey snapshot and Final ASCEND Passport
- `opportunities/` — matched interviews and interview kits

Pages here render data fetched from the backend API (one call per page,
Supabase JWT attached). No business logic, no direct database access.
