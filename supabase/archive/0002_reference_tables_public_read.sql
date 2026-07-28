-- Restores public read access to employability_dimensions, target_roles,
-- and readiness_rules.
--
-- These are reference/config tables that were always meant to be freely
-- readable (writes remain service-role-only per docs/BUILD_GUIDE.md 2.8)
-- — the original supabase/schema.sql never enabled RLS on them at all.
--
-- At some point after Session 2, RLS was enabled on these three tables
-- directly in the Supabase Dashboard (most likely via the Security
-- Advisor's "Enable RLS" prompt, which flags every public table without
-- RLS) with no accompanying policy. With RLS on and no policy, Postgres
-- silently returns zero rows to every non-service-role client — no
-- error, just an empty result. This broke the Session 8 dashboard
-- (employability_dimensions came back empty, so no dimension cards
-- rendered) without any application code changing at all — confirmed by
-- diffing src/app/dashboard/page.tsx against its Session 8 commit
-- (zero diff) and by querying these tables with the service role (5
-- rows, all active) versus the anon key (0 rows, no error) directly.
alter table employability_dimensions enable row level security;
alter table target_roles enable row level security;
alter table readiness_rules enable row level security;

create policy "dimensions_public_read" on employability_dimensions
  for select using (true);
create policy "target_roles_public_read" on target_roles
  for select using (true);
create policy "readiness_rules_public_read" on readiness_rules
  for select using (true);
