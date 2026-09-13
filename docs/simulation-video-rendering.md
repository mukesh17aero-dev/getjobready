# Optional admin video rendering

Open http://localhost:3000/admin/studio, choose a role and Curriculum. Generating learning material creates a storyboard only. The optional **Render video** action takes a saved skill storyboard; admins can first edit visual direction, narration and scene durations. Existing externally produced video/caption URLs remain supported.

A separate backend worker produces original SVG-based workplace diagrams and progressive scene reveals, PNG illustrations, OpenAI narration, a 720p H.264/AAC MP4, an embedded subtitle stream and WebVTT captions. This is an illustrated explainer, not photorealistic footage or avatar video. Text-fitting preserves policy values. Speech volume is normalised; narration is not truncated to hit duration. Caption timing is estimated within each scene, not word-aligned speech recognition, so reviewers should check synchronisation.

The renderer uses a cached Anthropic scene plan and `gpt-4o-mini-tts` narration. It checks planned duration and a 360-word narration ceiling before spending. Repeated requests for the same source reuse the job. Failed jobs permit at most three attempts; local intermediate narration is reused when available. Rendering an edited storyboard creates a new source digest. Generating ordinary curricula never queues a render or publishes a release.

## Storage and review

Migration `0039_simulation_media_jobs.sql` adds the private durable queue. Applied to the local database only. The worker creates/requires the private `simulation-media` Supabase bucket and refuses a public bucket. Uploaded paths are unique per job/attempt; authenticated admin endpoints issue 30-minute preview URLs. Draft JSON stores the render ID, not signed URLs.

A completed render attaches only when its source still matches the latest draft, increments its revision, resets media review and invalidates earlier package approvals. Concurrent edits are preserved. Changed storyboards, wrong role/skill IDs, or failed renders cannot pass media checks before review/publication. Rendering does not publish. Existing local two-admin test bypass is unchanged.

## Run locally or deploy

In the backend repository, install dependencies, apply migrations and run `npm run build`. Keep the API running and start the separate renderer with:

```sh
node --env-file=.env dist/workers/simulation-renderer.js
```

Requirements: Node 22, FFmpeg and ffprobe in PATH, system fonts, existing database/Supabase service-role settings, `ANTHROPIC_API_KEY` and `OPENAI_API_KEY`. Optional paths: `FFMPEG_PATH`, `FFPROBE_PATH`, `SIMULATION_RENDER_DIR`. Run `Dockerfile.video` as a separate background worker on the hosting service for the same environment as the API. No browser or Next.js server executes rendering. No deployment or remote database migration has been performed. The Customer Success Associate curriculum is now published in the local database as an explicitly marked test release.

## Verified sample

Customer Success Associate → Customer case resolution, draft render `a3443ad9-d765-4069-8e57-eafccd6dc493`: seven scenes, 90.021 seconds, 1280×720, H.264, AAC and embedded English subtitles. The first sample caught clipped policy text and quiet narration; the corrected render displays the complete ₹2,000 scenario limit and normalised audio. Inspected rendered PNGs and FFprobe/audio measurements. Verified actual playback with captions in the signed-in admin browser. Private MP4, caption and illustration URLs loaded successfully.

Two test renders were made, with fourteen scene narration calls, one paid scene-plan call (1,612 input / 660 output tokens) and one application-cache hit. Narration billing tokens are not returned/stored by this integration, so voice costs are estimates; consult the provider billing dashboard for exact charges. Original curriculum generation, server time, storage, bandwidth and taxes are separate.

Tests cover timing, caption offsets, escaped SVG, complete policy text, source digests, explicit-only queueing, duplicate requests, competing workers, stale-draft protection, private storage and the retry cap. Seven isolated database lifecycle tests and 22 relevant backend unit tests passed. Frontend typecheck, 85 tests and lint passed (five unrelated existing warnings). Production build verification is recorded separately once complete.

YouTube is separate: reviewed selected links play in YouTube’s embedded iframe within Ascend, including configured start/end bounds. Search-only entries stay search links until a specific video is selected. YouTube video files are never downloaded into the in-house renderer or played through the native MP4 element.

Final build validation: the frontend production build passed after allowing its existing Google font downloads; all 79 static pages generated. Backend build passed. A repeated four-test isolated media lifecycle run passed after the final input validation changes. The persistent local video worker was not started: automatic approval review requires approval for future admin-triggered jobs beyond the sample. The sample itself is already available and was verified in the browser.


## Complete local course and Indian English update

Customer Success Associate local test release v1 includes 10 skill lessons, 30 missions (guided, independent and transfer for each skill), and three complete baseline/reassessment assignment sets. Each assessment has 12 questions. Customer care (119.146 seconds) and Customer case resolution (90.021 seconds) now have rendered films using the versioned Indian English narration instructions. Eight other skills have editable storyboards; rendering those films is optional.

Open http://localhost:3000/practice/missions?role=customer_success_associate for the student course. Signed-in browser verification confirmed course discovery, starting/resuming a 20-minute × 4-day plan, ten skill entries and the reassessment gate. Draft persistence, ownership, revision conflicts, private criteria, media access and unlocking twelve fresh questions passed isolated backend integration tests. Completion bars and AI coaching are available; validated productivity scoring and a gap-adaptive schedule are not yet implemented.

YouTube suggestions are optional, beginner-filtered and ranked by actual views after relevance checks. An official API test for Customer care returned one matching 230-second video with 36,924 views at lookup; weaker matches were excluded. Admins now have an Open search on YouTube link beside suggestions, a per-lesson search link above manual URL entry, and up to three resource slots. Selecting a video does not approve it. Unreviewed YouTube videos remain absent from the student course, including local test releases.

Final backend build and 17 focused rendering/YouTube/learner/media tests passed. Frontend typecheck, lint (five existing unrelated warnings), 85 tests and production build passed before the final search-link-only change; that change has its own verification run. The persistent renderer remains stopped pending the outstanding approval for future admin-triggered external AI/storage jobs. The explicitly scoped Customer Success rendering and local publication completed successfully.

## Full lesson coverage and personalised plans — local v2

Local Customer Success Associate release v2 now includes all ten skill films plus a separate 102.896-second role introduction (11 narrated films total). The introduction covers responsibilities, day-to-day expectations and general recruiter preparation; employer expectations are explicitly variable. Every skill video and the introduction must be reviewed before normal publication. Generation planning now includes the introduction for every newly onboarded role. Editors and fixed review snapshots show the introduction as UI content.

Nine skills have selected beginner YouTube suggestions in the local test, visibly labelled “Admin review pending”; these are selected candidate IDs, not arbitrary search results. Follow-through currently has no strong beginner match, so it does not get an unrelated filler video. Normal live releases still require approval. The local-only preview exception is explicit and cannot apply outside the local test environment.

Migration 0041 adds daily commitment, target date, timezone, a versioned stored plan and introduction completion to existing RLS-protected simulation sessions. Applied locally only. New plans default to one hour; the native date input provides the calendar picker. Personalisation is automatic. The planner uses the latest completed same-role readiness result, matching canonical skill IDs/names, plus completed lessons, submitted work and unfinished responses. Missing evidence stays unmeasured. It does not infer traits or proficiency from page visits. Daily minutes include estimated thinking/practice time; tight deadlines produce a feasibility warning instead of removing work. Longer tasks can span days. Schedule recomputation is audited and a reschedule action starts remaining work from today. Media-only course updates preserve assignments and existing work.

Practice CTA statuses now derive from stored progress: Not started, Started, In progress, Completed. Completion includes intro, skill lessons, missions and twelve fresh questions; it is not a verified readiness score. The daily plan and role introduction have no learning/work tab strip. Unsigned users see one fictional Customer Success task at /practice/missions; trying to answer opens a sign-in dialog. The same preview is reviewable with ?preview=1 without signing out.

Readiness and simulation reassessment restrict copy, cut, paste, drag/drop and native paste insertion. Print output is hidden and visible content is watermarked/concealed when focus leaves. Simulation reassessment records whitelisted browser events in the audit log and asks for acknowledgement after focus changes. These browser controls cannot prevent OS screenshots, cameras, developer-tool extraction or forged API submissions, and do not make automatic cheating findings.

Private media signing now uses one batch request and a bounded server cache with real expiry metadata. Course ownership is checked before serving each media response. The client deduplicates media requests, warms introduction/first-lesson URLs, and prefetches a selected skill on hover/focus. A local measurement was 302 ms for a cold introduction-media response and 10 ms cached; this is link-preparation latency, not a guarantee of playback startup on every network.

Browser verification confirmed the saved one-hour/18-September plan and deadline warning, preserved prior lesson completion, loaded native lesson video controls, and actual embedded YouTube playback. Frontend typecheck, lint (five unrelated existing warnings), 87 tests and production build passed. Backend checks cover daily schedule ordering, date/timezone validation, missing evidence, task splitting, progress, ownership, integration persistence and signed-media caching. No remote deployment was performed.


### Schedule preview and additional resources (12 September)

Local CSA release v3 selects up to three of the existing relevant YouTube candidates per lesson. Seven lessons have three, two have one, and Follow-through has none yet. This selection is for the explicitly authorised local test; reviewed flags and production approval rules remain intact. The resource-only release upgrade is audited and preserves the existing learner's answers, completion and daily plan. Learn groups the embeds under Additional resources, without duplicate titles. The learner test banner is removed. Daily plan is in the sidebar only.

`POST /v1/simulations/plan-preview` is read-only and runs the same backend planner as saving. Setup previews total work, expected finish and whether the target fits; one-click options increase daily hours or move the finish date. Saving waits for a feasible, current preview. Original scheduled days persist until an explicit replan, so automatic progress refresh cannot hide overdue work. Tasks spanning multiple days become overdue only after their final scheduled day. A missed schedule is completion feedback, never a skill score.

The root layout mounts a shared floating media controller. Playing HTML5 videos and official YouTube embeds retain their original element and playback position while out of view. The compact player has only Restore and Close icon buttons with accessible names; playback controls remain within each video. Camera previews and decorative autoplay loops are excluded. YouTube uses the official IFrame API; ordinary embeds continue to work if that API is blocked. No third-party player package added.

Checks: 90 frontend tests passed; final production build and its TypeScript check passed after the icon-only control change. Backend build, ten schedule unit tests, two media-cache tests and eight isolated local-database integration tests passed. Integration coverage confirms plan preview does not create a session. Chrome confirmed the test banner removal, four chapter tabs and three embedded Additional resources; the separate in-app playback test crashed, so full floating-player interaction verification there was unavailable.

The daily-plan screen now has one Replan my schedule action, opening the same hours/date feasibility editor. Removed the record-explanation disclosure and the separate immediate-reschedule button. Saving a revised plan preserves completed work and explicitly resets the remaining schedule baseline.

Floating controls now sit at the top-right: native lessons overlay Restore and Close icons; YouTube has only Close in its top frame, without obscuring its own controls. No bottom control strip. Additional resources uses three equal columns on desktop (including a single resource), two at tablet widths and one on phones.

### Progress overview and English-only YouTube resources

A compact completion summary appears above the workspace, with a dedicated Your progress entry beside Your daily plan. It uses backend `simulation-completion-v1` aggregates from saved lesson flags and submitted work. Drafts count as in progress, not completion; unknown/duplicate skill IDs and unrelated work cannot inflate counts. The detailed view shows the introduction, lessons, missions, reassessment, schedule status, per-skill completion (six skills per page), and an eligible continuation. An unfinished draft is prioritised by saved update time after the introduction. The existing assessment unlock rules remain enforced. No database migration or new AI call is required.

Chrome verification showed 3% completion, 2 of 53 steps, the completed introduction, one covered skill lesson, zero submitted missions, and locked reassessment for the existing CSA test user. No learner work was fabricated or reset.

YouTube recommendations now require English default-audio metadata and reject conflicting non-English titles/channel names. English relevance-language search alone is insufficient: the API can return other languages, and one selected Urdu/Hindi-titled video was incorrectly tagged `en`. Missing/conflicting language is excluded automatically. A manually selected resource requires the admin's explicit confirmation of English spoken audio as part of review. Backend publication and learner filtering enforce the policy. These are metadata/reviewer checks, not an AI transcription guarantee.

The local CSA draft/release was cleaned using a single batch metadata request: v4 retains 14 eligible selections across nine skills; Follow-through still has no appropriate resource. The resource-only release change is audited and retains learner work and schedule. Non-English and unknown-language candidates were removed from the local draft as well. Production review gates were not relaxed.

Your progress is a course-wide destination only: it remains in the sidebar and summary, and was removed from chapter tabs. The progress overview itself has no chapter tab strip.
