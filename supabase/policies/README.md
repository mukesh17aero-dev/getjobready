# supabase/policies — reserved

Reserved by ASCEND-ENG-015 §12 for RLS policies kept as standalone, reviewable
files. Today every policy is defined inline in `schema.sql` and the numbered
migrations; see `docs/DATABASE_SCHEMA.md` for the current per-table RLS state.

Whatever lands here must still be applied through a numbered migration —
migrations remain the source of truth.
