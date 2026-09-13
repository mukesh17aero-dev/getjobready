# Admin role studio — local implementation

## Open it

- `/admin` (also `/admin/studio`): current onboarded roles, skill snapshots, curriculum and simulation authoring.
- `/admin?view=content`: existing Discovery role authoring, skill catalogue, assessment and interview banks.
- `/admin?view=content&add=1`: add a role or import roles; existing role detail and context writers remain available.
- `/admin/reviews`: in-app notifications, fixed review snapshots, comments, approvals, change requests and declines.
- `/previews/admin-role-studio.html`: isolated interactive design preview, with light/dark mode, sample role onboarding, assignment variants and approval UI.

The actual studio inherits Ascend's theme tokens. Welcome is unchanged.

## Creation flow

1. Add/draft a role in the existing content editor, review the Discovery details, and map canonical skills. Save the role and skill drafts.
2. Create its package in Role studio. The backend snapshots its role context and mapped skills. It uses admin drafts when present, otherwise published content.
3. Use the central Generate role simulations action with All skills selected, or choose one skill from its dropdown. Each successful module is saved separately, with optimistic revision checks. Failure does not discard earlier modules. The browser must stay open for the sequential batch; completed work can be resumed after interruption.
4. Review illustrated lesson text, worked examples, source cards, three workplace missions (guided, independent, transfer), baseline questions and fresh reassessment questions.
5. Generate two additional assignment variants per skill. Three complete variants provide at least 36 baseline and 36 reassessment questions per role, with 12 per sitting. The backend selection helper distributes variants using a learner seed, prioritises unseen IDs and reports eventual bank exhaustion. **This helper is not yet wired into the existing learner readiness runtime.** Existing learner assessments continue using the existing published assessment bank.
6. Produce/attach the captioned role video to the first mapped skill. Additional skill films are optional. Generation currently creates storyboards and narration scripts, not rendered video files. The current video upload screen remains available from the content editor.
7. If `YOUTUBE_API_KEY` is configured, generation fetches up to three embeddable video candidates through the official YouTube API. Otherwise it provides specific search links. Selected videos must be reviewed; no videos or transcripts are scraped or downloaded.
8. Request review, address feedback, then publish the approved revision. Incomplete or stale packages are blocked even in local test mode.

Publication writes immutable `simulation_releases`. **The learner simulation player, personalised gap/commitment planner, attempt persistence and productivity readiness scoring are not part of this authoring implementation yet.** Do not describe these drafts as a finished student course or validated proficiency report.

## Approval policy

- Two distinct admin identities and email addresses must approve the same content digest.
- Authors cannot approve their own submission.
- A decline or change request blocks publication, even if two other approvals exist.
- A comment does not erase an earlier decision. A reviewer must explicitly revise that decision.
- Changing the content supersedes the previous request and resets approvals for the next revision.
- Publishing checks approval inside the same database transaction as the release. Browser controls cannot bypass it.
- Role context refresh preserves old material but marks it stale; regeneration is required before publication.
- Existing content kinds (roles, skills, assessment, interview and video content) use the same publication gate.
- Review inbox lists do not transfer every large content snapshot; a selected snapshot is loaded separately.

`CONTENT_REVIEW_TEST_BYPASS=true` bypasses approval only when the database host is localhost/127.0.0.1/IPv6 loopback and `NODE_ENV` is not production. Each bypass is audited. It does not disable content completeness checks. Review emails are suppressed in test mode. The user explicitly requested this local test setting.

## Admin identity and notifications

The `identity` module owns `admin_accounts`. Verified Supabase user IDs are linked to active stored admin membership. An ordinary editable profile cannot promote itself. The console no longer defaults to authorising every signed-in account. `ADMIN_EMAILS` remains a supported operator allowlist; review recipients come from active approver accounts plus `CONTENT_APPROVER_EMAILS`.

Nithin Issac Daniel (`issac1993@gmail.com`) was granted active admin/approver membership **in the local database** by explicit user request. No remote database or Supabase authentication privileges were changed.

Emails use fixed templates, not AI. The notification module owns a durable outbox/inbox; a pg-boss worker polls pending messages, sends via Resend, retries with an idempotency key and records failures. A queued message is not labelled sent until the provider accepts it.

Email setup:

- `RESEND_API_KEY`
- `NOTIFICATION_FROM` on a verified sending domain
- `ADMIN_APP_URL` (the app origin used in secure review links)
- run the backend background worker

Email content contains the role/review title, status or feedback and an authenticated link. It does not attach complete question banks or learner records. Approvals happen after signing in; clicking an email link cannot approve anything.

## Database changes

Backend migrations applied to the configured local database:

- `0035_content_review.sql`: review snapshots and decision events.
- `0036_notification_review_inbox.sql`: notifications and email outbox.
- `0037_simulation_packages.sql`: editable packages and immutable releases.
- `0038_identity_admin_accounts.sql`: stored admin membership.

All new tables enable RLS with no direct browser read/write policy. Access is through authenticated backend routes. Apply these migrations before deploying the corresponding backend; never enable the local test bypass on a live deployment.

The six local roles were updated to 19 canonical skills, including role-specific functional skills and workplace writing. No trait/behaviour weights were invented for the new functional skills. Old content was backed up at `/tmp/ascend-skills-before-update.json`; changes and local publication bypasses are audited. Other role IDs already present in the matrix were preserved.

## Validation and outstanding checks

- Frontend typecheck, lint (five pre-existing warnings), 78 tests, and the normal Next.js production build pass. The admin routes are present in the build output.
- Backend typecheck and 294 tests pass; 41 existing integration tests skipped without their configured database.
- Added 11 focused approval/assignment tests and ran three additional lifecycle tests against a disposable local schema: duplicate reviewers, concurrent publishing, edit invalidation, notifications and mocked email retry.
- Browser verified the themed admin home, stored admin access, local approval-bypass notice, creation of a local Customer Success package, and the saved generated lesson, worked example, storyboard and video-review controls.
- The user explicitly approved the six-role Anthropic generation test. Completed successfully for all six local roles: one functional skill per role, with no learner data and no publication. Each saved module has three distinct practice missions, one baseline question, one fresh reassessment question, and a 90-second video storyboard. All 18 mission briefs are under 70 words. This is a generation/structure smoke test, not a validation of learning outcomes or complete course coverage. Initial live output exposed missing array limits in the generation instructions; prompt version `role-curriculum-v2` includes the exact schema limits and validation errors now identify the failing field. Three first-pass outputs exceeded array limits and were retried successfully. See `admin-role-studio-live-test.md` for the role-by-role result.
- Real email delivery needs sender credentials and has not been tested. YouTube live search needs its API key and has not been tested.
- No production deployment or git push has been performed for this work.

## Visual review and YouTube segments

The review inbox now renders the frozen review snapshot as role cards, skill/role tables, assessment and interview question cards, curriculum tabs and video players. Question banks are searchable and paginated at five per page. Additional configuration and private reviewer criteria are expandable. There is no raw-JSON preview fallback. Local test releases are labelled by content type in the inbox.

In Curriculum, paste a YouTube link or ID, enter Start and End as minutes:seconds, then Apply video & segment. For example, 0:00 and 4:00 produce native YouTube embed parameters `start=0&end=240`. Watch the segment, mark it reviewed and Save draft. The original video remains on YouTube; this is playback selection, not a downloaded or edited asset, and it does not suppress YouTube ads. Changing the selection resets its reviewed checkbox and changes the fixed-review digest. The backend rejects invalid or reversed intervals. No migration is needed because these optional fields are saved in the existing package JSON.

Manual links/embeds do not require a YouTube Data API key. Automatic discovery does. Create a Google Cloud project, enable YouTube Data API v3, create an API key under APIs & Services → Credentials and restrict it to YouTube Data API v3. Set `YOUTUBE_API_KEY` in `ascend-backend/.env` locally or in the backend deployment's environment, then restart that service. Do not use a `NEXT_PUBLIC_` variable. Existing search-only drafts do not retroactively fetch videos; admins can paste a selected link or generate new material once configured.

References: https://developers.google.com/youtube/v3/getting-started and https://developers.google.com/youtube/player_parameters#end.

Validation for this update: 83 frontend tests, frontend typecheck/lint/build, 14 backend approval/assignment/segment tests and backend typecheck/build passed. Browser accessibility verification confirmed the real submitted role snapshot displays as a role preview and the Curriculum editor exposes the link/start/end controls. Live YouTube playback was not exercised.

## One role, one generation action

In `/admin`, choose the role and use the central generation panel. “All skills for this role” plus “Learning & simulations” is the default. Generate automatically creates a role package if needed, asks the backend for remaining work, and generates each missing/outdated skill in sequence. Each module contains its lesson, three simulations, baseline/reassessment share and video storyboard. Existing current drafts are retained. The same panel offers “Additional assessment sets” after modules exist; it generates only missing variants.

The separate generation button on every skill has been removed. Pause finishes and saves the current request before stopping. Keep the page open during the run; refreshing or leaving stops the browser from scheduling further requests. The backend-saved package is the checkpoint, so starting again skips completed items. This is not a persistent background job. Generation never publishes material.

Backend `generation-plan` and `generate-next` routes own work selection and validate revision, role and skill scope. The browser displays progress and schedules the next authorised step. Concurrent edits fail safely on revision checks. Plan tests cover skipping completed modules, stale content, selected-skill scope, and missing assessment variants. Frontend tests verify one primary generation control and pause/progress states.

Generation-panel validation: 85 frontend tests and 17 backend approval/assignment/segment/planning tests passed, along with frontend typecheck/lint/build and backend typecheck/build. The full single-role batch has not been started from the browser; Chrome did not expose the signed-in Ascend tab during final verification. Existing six-role single-module results remain unchanged.

## Local YouTube configuration verified

On 12 September 2026, the user-supplied key was installed in the ignored local backend environment. The actual `findLearningVideos` integration returned HTTP 200 and three unreviewed YouTube candidates for a customer-complaint training query. The local backend was restarted to load it. No key value is stored in project documentation or frontend code. Remote deployment environment configuration is unchanged. Existing search-only modules are unchanged; new generation can fetch candidates.

## Optional in-house rendering

The storyboard-only limitation now has an implemented optional admin renderer. In Curriculum, choose a saved skill storyboard and **Render video**. A separate background worker creates narrated, captioned MP4 and PNG illustrations, saves private assets and attaches only to the matching draft. Review and publication remain separate. The actual 90-second Customer Success sample has been rendered and played in the admin browser. See [simulation-video-rendering.md](simulation-video-rendering.md) for setup, scope, storage and validation.
