-- 0001_identity_user_account.sql
-- Owning module: identity  (docs/data/OWNERSHIP.md)
--
-- WHAT THIS ADDS
--   public.user_account — one row per person who can sign in, holding the single
--   fact the rest of the platform needs about them: their role.
--
-- WHY
--   Supabase's auth.users tells us someone authenticated. It does not tell us
--   whether they are a student, an admin or an employer, and we must never take
--   that answer from the browser. This table is the server's answer.
--
-- WHAT BREAKS IF IT IS NOT APPLIED
--   Nobody can sign in. The identity module reads this table on every request to
--   decide where a person lands and what they may open.
--
-- NOTE ON THE LEGACY SCHEMA
--   The pre-reset database (supabase/archive/) is still live in this project and
--   contains a `students` table keyed on auth.users. This migration does not
--   touch it, shadow it or depend on it. When the student-discovery module is
--   built, `students` is explicitly reused, replaced or retired then.

create table if not exists public.user_account (
  id                 uuid primary key references auth.users (id) on delete cascade,
  email              text not null,
  username           text,
  full_name          text,
  role               text not null default 'student',
  is_bootstrap_admin boolean not null default false,
  created_at         timestamptz not null default now(),
  last_sign_in_at    timestamptz,

  constraint user_account_role_check
    check (role in ('student', 'admin', 'employer'))
);

-- Email and username are both sign-in identifiers, so both must be unique
-- case-insensitively — otherwise "Anita@x.com" and "anita@x.com" are two accounts
-- and the resolver has to guess which one the person meant.
create unique index if not exists user_account_email_lower_key
  on public.user_account (lower(email));

create unique index if not exists user_account_username_lower_key
  on public.user_account (lower(username))
  where username is not null;

-- There is exactly one break-glass admin, forever. A second one would double the
-- number of shared passwords this design exists to retire.
create unique index if not exists user_account_single_bootstrap_key
  on public.user_account ((true))
  where is_bootstrap_admin;

-- Counted on every bootstrap sign-in attempt to decide whether that account is
-- still allowed to use its password.
create index if not exists user_account_role_idx
  on public.user_account (role);

alter table public.user_account enable row level security;

-- A signed-in person may read their own row and nothing else. There is
-- deliberately no insert, update or delete policy: every write goes through the
-- identity module using the service-role key, server-side. A student cannot
-- promote themselves by writing to this table because no policy lets them write
-- to it at all.
drop policy if exists "user_account_select_own" on public.user_account;
create policy "user_account_select_own"
  on public.user_account
  for select
  using (auth.uid() = id);
