-- 0003_identity_user_account_scd2.sql
-- Owning module: identity  (docs/data/OWNERSHIP.md)
--
-- WHAT THIS CHANGES
--   public.user_account becomes a slowly-changing dimension (Type 2). A change
--   no longer overwrites a row: the current row is closed and a new one is
--   inserted, so every state a person has ever been in is still there.
--
-- WHY
--   "Who made this person an admin, and when?" must have an answer that survives
--   the next change. Overwriting a role destroys the only evidence that the
--   previous one existed.
--
-- THE SHAPE
--   account_id   surrogate key — one per *version*
--   user_id      the person — one per *human*, references auth.users
--   is_active    exactly one true row per user_id, enforced by a partial index
--   created_at / created_by   when this version came into effect, and who caused it
--   updated_at / updated_by   when it was superseded, and by whom. NULL while active.
--
--   So the active row's `created_by` is the direct answer to "who put them in
--   this state", and the closed rows are the history behind it.
--
-- ONE DELIBERATE EXCEPTION
--   `last_sign_in_at` is overwritten in place and never creates a version. It is
--   a Type 1 attribute inside a Type 2 dimension — a standard hybrid. Versioning
--   it would add a row per sign-in and bury every real change in noise.
--
-- WHAT BREAKS IF IT IS NOT APPLIED
--   Sign-in and the admin screens both stop working. This migration is not
--   optional once the matching code ships.
--
-- WHAT IT ADDS
--   account_id, user_id, is_active, created_by, updated_at, updated_by.
--   `created_at` already exists — it came with 0001.
--
-- NOTE ON THE NUMBERING GAP
--   There is no 0002. It added `role_changed_at` / `role_changed_by`, which this
--   migration would immediately have removed: per-version provenance records
--   every change, not only the most recent one. It was never applied to any
--   database, so it was deleted rather than left as a step that exists only to
--   be undone. The `drop column if exists` lines below stay as a safety net.

-- ---------------------------------------------------------------------------
-- 1. New columns
-- ---------------------------------------------------------------------------

alter table public.user_account
  add column if not exists account_id uuid not null default gen_random_uuid(),
  add column if not exists user_id    uuid,
  add column if not exists is_active  boolean not null default true,
  add column if not exists created_by uuid references auth.users (id),
  add column if not exists updated_at timestamptz,
  add column if not exists updated_by uuid references auth.users (id);

-- ---------------------------------------------------------------------------
-- 2. Carry the existing rows across before the old key disappears
-- ---------------------------------------------------------------------------

-- Existing people become the first version of themselves. `created_by` stays
-- null for them: nobody put them in this state through the admin console, and
-- inventing an actor would be worse than admitting we do not know.
update public.user_account set user_id = id where user_id is null;

-- ---------------------------------------------------------------------------
-- 3. Swap the primary key: id (one per person) -> account_id (one per version)
--
--    Dropping `id` takes the old primary key and its foreign key with it.
-- ---------------------------------------------------------------------------

drop policy if exists "user_account_select_own" on public.user_account;

drop index if exists public.user_account_email_lower_key;
drop index if exists public.user_account_username_lower_key;
drop index if exists public.user_account_single_bootstrap_key;
drop index if exists public.user_account_role_idx;

alter table public.user_account drop column if exists id;
alter table public.user_account drop column if exists role_changed_at;
alter table public.user_account drop column if exists role_changed_by;

alter table public.user_account alter column user_id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'user_account_pkey'
       and conrelid = 'public.user_account'::regclass
  ) then
    alter table public.user_account add constraint user_account_pkey primary key (account_id);
  end if;

  if not exists (
    select 1 from pg_constraint
     where conname = 'user_account_user_id_fkey'
       and conrelid = 'public.user_account'::regclass
  ) then
    alter table public.user_account
      add constraint user_account_user_id_fkey
      foreign key (user_id) references auth.users (id) on delete cascade;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 4. Uniqueness now applies only to the active row
--
--    Without the `where is_active` clause every historical row would collide
--    with the current one and no change could ever be recorded.
-- ---------------------------------------------------------------------------

create unique index if not exists user_account_one_active_per_user
  on public.user_account (user_id)
  where is_active;

create unique index if not exists user_account_active_email_key
  on public.user_account (lower(email))
  where is_active;

create unique index if not exists user_account_active_username_key
  on public.user_account (lower(username))
  where is_active and username is not null;

create unique index if not exists user_account_active_bootstrap_key
  on public.user_account ((true))
  where is_active and is_bootstrap_admin;

create index if not exists user_account_user_id_idx
  on public.user_account (user_id);

create index if not exists user_account_active_role_idx
  on public.user_account (role)
  where is_active;

-- ---------------------------------------------------------------------------
-- 5. RLS — a person reads their own current row, and nothing else
--
--    Still no insert, update or delete policy. Every write goes through the
--    identity module with the service-role key.
-- ---------------------------------------------------------------------------

alter table public.user_account enable row level security;

drop policy if exists "user_account_select_own_active" on public.user_account;
create policy "user_account_select_own_active"
  on public.user_account
  for select
  using (auth.uid() = user_id and is_active);

-- ---------------------------------------------------------------------------
-- 6. All writes go through one atomic function
--
--    Closing the old row and inserting the new one must be a single
--    transaction. Done as two round trips from the application, a failure
--    between them leaves a person with NO active row — and the next request
--    would treat them as brand new and quietly recreate them as a student.
--    An admin could be demoted by a dropped connection.
--
--    SECURITY INVOKER (the default) on purpose: the function runs with the
--    caller's rights, so RLS still applies to anyone who is not the service
--    role. A SECURITY DEFINER function here would be a privilege-escalation
--    route if execute permission ever leaked.
-- ---------------------------------------------------------------------------

create or replace function public.set_user_account_state(
  p_user_id      uuid,
  p_email        text,
  p_username     text,
  p_full_name    text,
  p_role         text,
  p_is_bootstrap boolean,
  p_actor        uuid
)
returns public.user_account
language plpgsql
as $$
declare
  v_current public.user_account;
  v_new     public.user_account;
begin
  select * into v_current
    from public.user_account
   where user_id = p_user_id and is_active
   for update;

  -- Nothing material changed, so there is nothing worth a version. Without this
  -- guard, every sign-in that re-asserts the same details would add a row and
  -- the history would be unreadable.
  if found
     and v_current.email              is not distinct from lower(p_email)
     and v_current.username           is not distinct from p_username
     and v_current.full_name          is not distinct from p_full_name
     and v_current.role               is not distinct from p_role
     and v_current.is_bootstrap_admin is not distinct from p_is_bootstrap
  then
    return v_current;
  end if;

  if found then
    update public.user_account
       set is_active  = false,
           updated_at = now(),
           updated_by = p_actor
     where account_id = v_current.account_id;
  end if;

  insert into public.user_account (
    user_id, email, username, full_name, role, is_bootstrap_admin,
    is_active, created_at, created_by, last_sign_in_at
  ) values (
    p_user_id,
    lower(p_email),
    p_username,
    p_full_name,
    p_role,
    coalesce(p_is_bootstrap, false),
    true,
    now(),
    p_actor,
    v_current.last_sign_in_at
  )
  returning * into v_new;

  return v_new;
end;
$$;

-- Only the service role may call it. The application never exposes this to a
-- browser, and this makes that structural rather than a matter of discipline.
revoke all on function public.set_user_account_state(
  uuid, text, text, text, text, boolean, uuid
) from public, anon, authenticated;

grant execute on function public.set_user_account_state(
  uuid, text, text, text, text, boolean, uuid
) to service_role;
