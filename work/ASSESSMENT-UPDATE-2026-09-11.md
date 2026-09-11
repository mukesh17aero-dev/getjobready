# Role assessment update

Published assessment_arc v7 through the authenticated admin console. All 460 questions across six roles were converted to a question plus context cards. Scenario identities, numeric facts, workplaces and role skill lists were retained. Three tasks that required live AI output now request the candidate's own response; the matching authoring checks and dependent variants were updated. Supplied AI drafts remain reading material for critical evaluation.

The admin editor separates the question, card titles and card text. The backend generation prompt uses this format for future questions. The bulk conversion is idempotent and edits a draft before publication.

The backend determines assistance from the persisted question position: AI on questions 1 and 2 only. Buddy requests and later AI requests are refused server-side. The existing limit of three AI requests per supported question remains.

Answer fields block copy, cut, paste and text drops. Browser visibility and window focus changes produce warnings. Captured observations include event timestamps, time away and blocked-action counts; no clipboard contents, external window titles or destination URLs are collected. These observations do not automatically change readiness scores or establish cheating.

Integrity details autosave with the answer draft and persist with submitted/partial answers. Unanswered final-draft activity is retained in the finish audit. Detailed events are capped at 100 per question, with aggregate counts and an omitted-event count. First-party assessment activity footprints provide an additional event trail. Browser observations are client-reported and transport remains dependent on connectivity.

Backend migration `0032_assessment_integrity.sql` was applied to the configured database. No unrelated pending migrations were applied. Backend files are in the adjacent `ascend-backend` repository and must accompany frontend deployment.

Validation: frontend typecheck, lint (five existing unrelated warnings), 55 tests and production build pass. Backend typecheck, 259 tests and build pass; 41 integration tests remain skipped. In Chrome's guest preview, paste was blocked, typing worked, cut left the answer intact, and returning from a tab displayed the elapsed time away. Dark and light layouts were inspected, including stacked cards and the corrected header at 360px. No test answer was saved into the user's assessment history.

An optional full-bank AI rewrite was rejected by automatic approval review before transmission. Bank edits were prepared locally instead.

Follow-up: student question text, context cards, titles and response choices now prevent native text selection/copying. A document-level copy/cut guard also handles page-wide selections containing assessment content, and blocks dragging text out. Answer text remains selectable for editing. Admin authoring fields remain editable. Copy attempts use the existing recorded activity counters.

Tab/window departures now open a native modal acknowledgement prompt, visible regardless of page scroll. Escape and backdrop clicks do not dismiss it; the acknowledgement button does. The popup no longer shows the timer/cheating sentence. Automatic ending after another switch is awaiting the founder's policy choice; no automatic ending rule has been added in this follow-up.

## Student introduction and wording update

- Published assessment_arc v8 through the signed-in admin UI. All 460 briefs match the reviewed local import. Eighteen introductory examples (first three in each role's first workplace) were individually rewritten, usually from 150–230 words to 90–130. The other 442 received conservative wording/layout edits; they were not comprehensively rewritten. Original numeric values, scoring criteria, measures, response formats and bank metadata were checked and preserved. Local source: `/tmp/assessment-student-wording.json`; private editing script `/tmp/edit-assessment-wording.py`. Neither is publicly served or sent to an AI provider.
- New `AssessmentIntroduction` puts a visible video player first with a large Play introduction button. Start is enabled when the video ends or the student acknowledges the equivalent transcript. Video/audio errors offer the text route. No autoplay. Decorative introduction numbering removed.
- The video is now narrated (Mac Samantha voice), 51 seconds, approximately 740 KB, with English captions and matching text. The first silent version was replaced following founder feedback. Assets: `public/assessment/`; renderer `/tmp/render-assessment-intro.py` uses a temporary Pillow environment and ffmpeg. Mac speech synthesis requires the approved unsandboxed run; sandboxed `say` produced empty audio. Final audio verified: mean -16.2 dB, peak -1.3 dB.
- `assessment-glossary.ts` provides relevant plain-language definitions beside every question, including support tickets, dashboards, CRM, stock, escalation and common abbreviations. Definitions do not expose the answer or scoring criteria.
- Admin local JSON wording import changes only briefs, requires exact original-text matches, rejects duplicate/missing/conflicting questions atomically, then follows the usual Save draft / Publish workflow.
- Assessment authoring prompt v6-student-friendly: short actual task, 2–3 context cards, plain definitions, no unnecessary first-day story, preserve necessary facts/tables, check arithmetic, no buddy assistance, AI only on delivered questions 1 and 2. Generated questions outside the reading-length guide trigger an admin review warning. Team prompt v2-student-context and AI assist prompt v5-student-friendly use the same audience assumptions.
- Fixed start/resume opening an expired, empty attempt as a zero-answer report: the backend now starts a fresh run after closing that empty expired attempt. Historical records are kept. Regression test `assessment-empty-resume.test.ts` verifies a fresh question is returned. Empty-result UI has a fresh-start action and no fake readiness metrics. Report labels now say Questions answered instead of Days you worked; the outdated Twenty minutes explanation is removed.

### Confirmed and implemented: 12 questions, no timer

Founder explicitly chose “use 12 questions”. Migration 0033 adds a pinned question limit; new runs default to 12. Unfinished legacy runs adopt 12 questions and clear deadlines under their row lock with an audit event, keeping answers, drafts, path and begin marker. Completed historical runs remain unchanged. Both existing unfinished runs were verified at questionLimit=12, deadlineAt=null, finishedAt=null.

The adaptive selector uses question count, with AI on the first two delivered questions only. Question twelve completes the run; the backend refuses early report requests and extra answers. New runs select only workplaces with at least 12 questions. Hub Supervisor t1 has eight, so new runs use its other eligible workplaces. No current unfinished run uses that short pool. UI shows Question N of 12, question progress, no countdown, and Submit & see my report on the last question. Prompts and admin authoring warnings now use the count requirement. Existing narrated media contains no time-limit claim and remains valid.

Discovery guest follow-up: Customer Success Associate is the single free role from the canonical catalogue. It is pinned first for unsigned users; the other cards are blurred and inert with sign-in links returning to the requested role. Direct role pages also enforce the same presentation gate. Signed-in ordering and cards are unchanged. Chrome verified the free role first, five locked cards, and opening the free role. The public catalogue remains a public API; this is a UI gate.

Current validation: frontend typecheck, lint (five pre-existing warnings), 63 tests pass; production build passes outside the sandbox (sandboxed Turbopack stalled at compile). Backend typecheck, 277 tests and build pass, 41 opt-in integration tests skipped. Regression coverage includes twelve unique questions despite elapsed time, first-two AI support, resuming question twelve, preventing early finish, completion at twelve, audited legacy adoption and preserving completed records.

### Earlier validation

Validation at handoff: frontend typecheck, lint (five pre-existing warnings, no errors), 63 tests and production build pass; backend typecheck, 267 tests (41 opt-in integration tests skipped) and build pass. Chrome screenshot verified the prominent narrated player in dark mode and an unsigned preview showing the newly published Operations Executive question plus vocabulary help. Video started with volume at 100%; its file has non-silent speech and a 51-second duration. Exact caption/transcript parity checked. Browser interaction is frequently interrupted by the user; no mobile screenshot was completed in this pass. An Incognito readiness preview window was created for testing and the user subsequently interacted with it; do not close it blindly. The separate signed-in Admin console tab remains open.

### Test deployment setup gap discovered later on September 11

The deployed frontend points to https://ascend-backendservice-3.onrender.com. Its SQL health reports the Supabase pooler; local `.env` DATABASE_URL points to localhost. Earlier migrations were applied locally, not to deployed Supabase. Schema-only REST checks with the configured service credential returned PGRST205 for assessment_runs and assessment_answers; discovery_attempts and its selection columns exist. The signed-in test homepage shows Customer Success Associate as saved. REST returned no published assessment_arc documents; the public roles endpoint had been advertising getArcs()'s built-in seed. Both missing schema and missing published bank must be resolved on the deployed database.

Fixed frontend: API failure now renders a retry state preserving the known chosen role; empty published list has a separate state. ReadinessStart honours the URL/saved role instead of always selecting roles[0]. Fixed backend: only actual published banks with an eligible 12-question workplace count as available, no seed fallback. Added migration 0034 enabling assessment table RLS (0026 omitted it). Backend SQL/service role access remains available; browser roles have no direct answer-writing policy.

Pushed from isolated worktrees to daniel/wip: frontend 9c57892, backend 9209599. Claude's active local daniel/personal branches were not switched; the same fixes remain uncommitted in the shared working trees. Isolated checkouts: /tmp/ascend-readiness-frontend-fix and /tmp/ascend-readiness-backend-fix. Tests: 68 frontend, 279 backend, typechecks/builds pass; lint has five existing warnings.

Prepared work/DEPLOY-ASSESSMENT-SCHEMA-2026-09-11.sql applies assessment migrations 0026–0034 transactionally with migration-ledger guards and row security. The script was run twice locally before adding the existing 0029 content-kind migration to the bundle. It is NOT applied on test Supabase yet. Prepared approved bank /tmp/ascend-approved-assessment-bank.json has six roles and 460 questions, from local published v8; it is NOT published on test yet. Do not replace any subsequently created test bank/draft without comparing it first.

Pending user input: requested that they sign in and open Supabase SQL editor for project polkexjgphmwtpwhmspk in Chrome. No reply at handoff. No direct deployed database SQL credential is available; service-role REST can inspect existing data but cannot apply schema SQL. Browser is actively used by the founder; navigation repeatedly interrupted. Applying SQL and publishing the reviewed bank remain required before the deployed readiness assessment will run. Do not claim this deployment issue fully fixed yet.

## Tool launch visibility and resume layout follow-up

- Frontend `26eadcc`: Practice, Resume and Interview tab activation reveals/focuses the selected launch action (or in-development state), including repeated selection. Actions precede the long explanation; reduced motion uses instant scrolling. Arrow-key tab navigation retains tab focus.
- Resume builder Choose a look now occupies the left setup column. Selected-plan template gating is preserved.
- Frontend typecheck, lint (five pre-existing warnings), 74 tests and production build passed. Native Chrome returned no page accessibility content, so interactive visual verification remains pending.
- User will apply test database changes. Run `work/DEPLOY-ASSESSMENT-SCHEMA-2026-09-11.sql` in Supabase project `polkexjgphmwtpwhmspk`; not applied by this agent.
- Prepared `work/IMPORT-REVIEWED-ASSESSMENT-DRAFT-2026-09-11.sql` locally (not committed): imports the reviewed 460-question/six-role bank as a draft, refuses to overwrite any existing assessment content. Run after schema update, then reload the test Admin > Assessment and publish the reviewed draft through the usual admin flow. Contains scoring criteria; do not put under public/.

## Database import recovery

User hit missing public.content_documents and SQL-editor size rejection. Corrected the schema bundle to create the migration-0011 prerequisite and record the four earlier kind-only constraint changes superseded by 0029. Tested from a completely empty isolated PostgreSQL 17 database, imported six roles/460 scenes, reran schema without changing the draft, confirmed question_limit default 12 and RLS on all three tables.

Added local `work/apply-assessment-database-update.py`: invokes psql against files to avoid the SQL editor payload limit; accepts only the configured Supabase test project and session pooler/direct port 5432. Reads connection URI/password with getpass and never saves or passes passwords in process arguments. User runs the importer in Terminal, then reviews/publishes in Admin. The bank SQL stays local, beside the helper. Test database validation only; test Supabase still not modified by this agent.

## Import connection mismatch

User supplied a placeholder URI for project pgovjkyqqyfqnmaangvr (us-east-2 pooler). The deployed frontend's public JS still names polkexjgphmwtpwhmspk and ascend-backendservice-3.onrender.com; local frontend/backend auth configuration agrees. Backend health timed out during this check, so its exact database project was not verified. Do not retarget the importer or application to pgov without confirming an intended environment migration. Updated importer to request Host and User individually plus a hidden database password, avoiding connection-URI parsing/encoding mistakes. Validation checks prove wrong-project input runs no SQL and does not prompt for a password.

## Test question bank published — 2026-09-11 15:36 UTC

User completed the file-based importer against polkexjgphmwtpwhmspk. Opened signed-in test Admin > Assessment, verified draft matches the reviewed local bank exactly using read-only Supabase REST (six roles, 460 questions, each question has skill mappings), then clicked Publish in Admin. Verified published version 2 at 2026-09-11T15:36:26.645605+00:00, exact data match, no remaining draft. Student API /v1/assessment/preview/roles now lists all six roles including Customer Success Associate. Admin displayed 12 questions/no time limit, first-two AI assistance and Buddy disabled. The Admin immediately after publishing showed stale v1 label, but direct database verification confirmed v2. Attempt to navigate student readiness was interrupted by user changing Chrome; no new assessment was started or submitted.

## Test role details restored

Compared local published role_catalogue v11 with test published v2. Role lists and all existing detail values were identical. Exactly three fields were missing on each of six roles: assistantNotes, acrossIndustries, studentQuestions. No test draft existed. Restored only those 18 fields into a new draft using configured test service credentials after a second read guarded against changes; inserted without upsert to avoid overwriting a concurrent draft. Backup snapshots at /tmp/ascend-role-catalogue-local.json and /tmp/ascend-role-catalogue-test.json.

Published via signed-in test Admin > Roles. Verified database published v3, no draft, and full equality with local v11. Verified public /v1/discovery content.roles exactly matches all six restored details. Some FAQ answers are blank locally and remain blank intentionally. Signed-in browser Discovery stayed at Loading and native screenshot was blank white, so student visual verification was unavailable; do not claim visual QA passed. No app source or scoring changes.
