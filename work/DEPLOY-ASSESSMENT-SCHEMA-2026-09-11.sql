-- Test Supabase project: polkexjgphmwtpwhmspk
-- Adds the missing assessment schema only. Existing Discovery choices and
-- published question banks are not changed. Runs as one transaction.
-- Run in the Supabase SQL editor as the database owner.
begin;
create table if not exists public.schema_migrations (
  name text primary key,
  applied_at timestamptz not null default now()
);
alter table public.schema_migrations enable row level security;

do $apply$
begin
  if not exists (select 1 from public.schema_migrations where name = '0026_assessment_runs.sql') then
    execute $migration$
-- 0026_assessment_runs.sql
-- Owner: assessment-run module (src/modules/assessment-run).
--
-- Somebody sitting the role readiness assessment: which scenes they were
-- given, what they did, and when they reached for help.
--
-- TWO TABLES, AND THE SPLIT MATTERS.
--
--   assessment_runs   one sitting. Holds the scene ids it was built from,
--                     frozen at the start. The pool an admin publishes goes on
--                     changing; a sitting must not change under somebody
--                     half-way through it, and a read-out written later has to
--                     be able to say which scenes it was actually about.
--
--   assessment_answers  one row per scene attempted. Never overwritten - a
--                     second attempt at the same scene is a second row, because
--                     improvement between two goes at the same problem is the
--                     strongest thing this measures and an update would erase
--                     exactly that.
--
-- WHAT IS NOT HERE: a proficiency score. A score is issued only after repeated
-- evidence crosses a verification threshold (see the simulation module's
-- README), and one sitting is not that. What this stores is what happened;
-- what it means is read from these rows, never copied into them.

create table if not exists public.assessment_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role_id text not null,
  -- The arc's own fiction, kept so a resumed sitting greets them the same way.
  company text not null default '',
  buddy text not null default '',
  -- The scenes this sitting was built from, in order, frozen at the start.
  scene_ids jsonb not null default '[]'::jsonb,
  -- Which content version produced it, so a sitting can be traced to the pool
  -- it came from after that pool has moved on.
  content_version text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  -- Set when they walked away rather than finished. Distinct from a null
  -- finished_at on a sitting still open in another tab.
  abandoned_at timestamptz
);

create index if not exists assessment_runs_user_idx
  on public.assessment_runs (user_id, started_at desc);

create table if not exists public.assessment_answers (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.assessment_runs (id) on delete cascade,
  user_id uuid not null,
  scene_id text not null,
  -- What they produced. Typed prose, a transcript of what they said, or the
  -- named fields of an artefact - the mode is on the scene, not here.
  response text not null default '',
  answered_via text not null default 'typed',
  -- Seconds from the scene appearing to them sending it. The scene says two to
  -- four minutes; whether somebody used thirty seconds or the full four is a
  -- reading in itself.
  seconds integer,
  -- WHEN they reached for help, not how often. Reaching early on something
  -- hard is good judgement; never reaching and going the wrong way in silence
  -- is the more expensive failure. Null means they did not reach at all.
  asked_assistant_at_seconds integer,
  asked_buddy_at_seconds integer,
  created_at timestamptz not null default now()
);

create index if not exists assessment_answers_run_idx
  on public.assessment_answers (run_id, created_at);
create index if not exists assessment_answers_user_scene_idx
  on public.assessment_answers (user_id, scene_id, created_at);

$migration$;
    insert into public.schema_migrations(name) values ('0026_assessment_runs.sql');
  end if;
end
$apply$;

do $apply$
begin
  if not exists (select 1 from public.schema_migrations where name = '0027_assessment_reviews.sql') then
    execute $migration$
-- 0027_assessment_reviews.sql
-- Owner: assessment-review module (src/modules/assessment-review).
--
-- What a read of somebody's answers found, kept on the run it was about.
--
-- Stored rather than recomputed for two reasons, and the second is the real
-- one. It costs a model call, so regenerating it every time the page is opened
-- is waste. But more importantly a review is a thing that was said to a person
-- about their work: if it were recomputed, the same sitting could tell them
-- something different next week with no record that it had ever said the
-- first thing. Written once, kept, and shown as what it is.
--
-- Nullable, and a sitting is complete without it: the read-out stands on its
-- own, and a review that could not be produced must never block somebody from
-- seeing what they did.

alter table public.assessment_runs
  add column if not exists review jsonb,
  add column if not exists reviewed_at timestamptz;

$migration$;
    insert into public.schema_migrations(name) values ('0027_assessment_reviews.sql');
  end if;
end
$apply$;

do $apply$
begin
  if not exists (select 1 from public.schema_migrations where name = '0028_assessment_run_team.sql') then
    execute $migration$
-- 0028_assessment_run_team.sql
-- Owner: assessment-run module (src/modules/assessment-run).
--
-- Which workplace a sitting happens in.
--
-- A pool now carries two or three teams - the same role done in e-commerce, in
-- banking, in logistics - and a sitting is served from exactly one of them, so
-- somebody spends their fifteen minutes in one place with one buddy rather
-- than teleporting between three between scenes.
--
-- Frozen on the run for the same reason scene_ids is: the team is chosen once,
-- when the sitting starts, and a resume must land back in the same workplace.
-- Null on runs that started before teams existed; those read the pool's single
-- implied team.

alter table public.assessment_runs
  add column if not exists team_id text;

$migration$;
    insert into public.schema_migrations(name) values ('0028_assessment_run_team.sql');
  end if;
end
$apply$;

do $apply$
begin
  if not exists (select 1 from public.schema_migrations where name = '0029_content_kinds_arc_interview.sql') then
    execute $migration$
-- 0029_content_kinds_arc_interview.sql
-- Owner: content module (src/modules/content).
--
-- Lets the two newest content kinds actually be written.
--
-- content_documents.kind carries a CHECK constraint listing the allowed kinds,
-- and every kind before these arrived with a migration extending it (0014
-- question_bank, 0017 assessment_bank, 0019 video_uploads). Two did not:
--
--   assessment_arc   added to CONTENT_KINDS in the code without this
--   interview_bank   the same, added later
--
-- The effect was silent and total. Every save and every first-open seed for
-- those kinds violated the constraint, the route had no try/catch, and it
-- surfaced as a bare 500 - so the arc editor could write a whole pool, report
-- success from the model, and never persist a single row. Publish stayed
-- correctly disabled because there was genuinely nothing to publish.
--
-- The retired kinds stay in the list. The API no longer accepts them, but rows
-- written when it did are still in this table and must remain valid.

alter table public.content_documents
  drop constraint if exists content_documents_kind_check;

alter table public.content_documents
  add constraint content_documents_kind_check check (
    kind = any (array[
      'discovery_content',
      'role_catalogue',
      'skill_model',
      'assessment_arc',
      'interview_bank',
      'video_uploads',
      -- Retired: no longer written, but existing rows must stay valid.
      'question_bank',
      'assessment_bank'
    ])
  );

$migration$;
    insert into public.schema_migrations(name) values ('0029_content_kinds_arc_interview.sql');
  end if;
end
$apply$;

do $apply$
begin
  if not exists (select 1 from public.schema_migrations where name = '0030_assessment_help_log.sql') then
    execute $migration$
-- 0030_assessment_help_log.sql
-- Owner: assessment-run module (src/modules/assessment-run).
--
-- What the assistant and the buddy actually said, kept with the answer.
--
-- We recorded WHEN somebody reached for help and never WHAT came back. That
-- left the read-through unable to tell the one thing it most needs to: whether
-- an answer is theirs. A student can ask the assistant to draft the reply,
-- paste it unchanged, and be scored on the assistant's writing - which is the
-- opposite of what a scene about working with AI is for.
--
-- With the exchange stored, the reviewer can see that the submitted answer is
-- the assistant's draft word for word, or that they took it and fixed the
-- figure that was wrong, or that they asked nothing and wrote it themselves.
-- Those are three different pieces of evidence and they were indistinguishable.
--
-- Null where they asked nobody, which is most scenes.

alter table public.assessment_answers
  add column if not exists help_log jsonb;

$migration$;
    insert into public.schema_migrations(name) values ('0030_assessment_help_log.sql');
  end if;
end
$apply$;

do $apply$
begin
  if not exists (select 1 from public.schema_migrations where name = '0031_assessment_formats_deadline.sql') then
    execute $migration$
-- Owner: assessment-run. Existing table RLS/access policies remain unchanged.
alter table public.assessment_runs add column if not exists begun_at timestamptz;
alter table public.assessment_runs add column if not exists deadline_at timestamptz;
alter table public.assessment_runs add column if not exists draft jsonb;
alter table public.assessment_runs add column if not exists arc_snapshot jsonb;
alter table public.assessment_answers add column if not exists interaction_response jsonb;
alter table public.assessment_answers add column if not exists is_partial boolean not null default false;
-- Legacy rows have no explicit begin marker. Conservatively keep their existing
-- clock, including runs with no submitted answer; never grant an extension.
update public.assessment_runs r set begun_at = started_at, deadline_at = started_at + interval '15 minutes'
where begun_at is null;
create index if not exists assessment_runs_deadline_idx on public.assessment_runs(deadline_at) where finished_at is null;

$migration$;
    insert into public.schema_migrations(name) values ('0031_assessment_formats_deadline.sql');
  end if;
end
$apply$;

do $apply$
begin
  if not exists (select 1 from public.schema_migrations where name = '0032_assessment_integrity.sql') then
    execute $migration$
-- Owner: assessment-run. Existing assessment_answers RLS continues to apply.
-- Client-reported observations; no clipboard payload or destination information.
alter table public.assessment_answers add column if not exists integrity jsonb;
comment on column public.assessment_answers.integrity is 'Client-reported assessment focus and blocked clipboard observations. Not a cheating verdict.';

$migration$;
    insert into public.schema_migrations(name) values ('0032_assessment_integrity.sql');
  end if;
end
$apply$;

do $apply$
begin
  if not exists (select 1 from public.schema_migrations where name = '0033_assessment_question_limit.sql') then
    execute $migration$
-- Owner: assessment-run. Existing RLS policies remain in force.
-- Completed legacy runs keep their original timing policy. Open legacy runs
-- adopt the current policy under their row lock, with an audit event.
alter table public.assessment_runs add column question_limit integer check (question_limit > 0);
alter table public.assessment_runs alter column question_limit set default 12;

$migration$;
    insert into public.schema_migrations(name) values ('0033_assessment_question_limit.sql');
  end if;
end
$apply$;

do $apply$
begin
  if not exists (select 1 from public.schema_migrations where name = '0034_assessment_row_security.sql') then
    execute $migration$
-- Owner: assessment-run. Answers and scoring inputs are written through the
-- authenticated backend; browser roles must not write directly through REST.
-- No browser policies: the backend database/service role retains access.
alter table public.assessment_runs enable row level security;
alter table public.assessment_answers enable row level security;

$migration$;
    insert into public.schema_migrations(name) values ('0034_assessment_row_security.sql');
  end if;
end
$apply$;

notify pgrst, 'reload schema';
commit;
select table_name, column_name, column_default
from information_schema.columns
where table_schema = 'public' and
  ((table_name = 'assessment_runs' and column_name in ('question_limit','review','arc_snapshot','deadline_at'))
   or (table_name = 'assessment_answers' and column_name in ('integrity','interaction_response','is_partial')))
order by table_name, column_name;
