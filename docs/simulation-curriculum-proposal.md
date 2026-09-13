# Ascend simulations: curriculum, personalised practice and reassessment

Proposal prepared 12 September 2026 for 500–1,000 monthly active learners. This is a design and budget proposal, not an implemented feature or supplier quote. No paid generation, database changes, or production changes were performed. Welcome is outside this work.

**Required outcome:** learners improve on unfamiliar role-specific work, can explain that work in an interview, and retain the skill beyond the course. Engagement supports those outcomes; watch time, badges and completion are not substitutes. All current and future onboarded roles are in scope, with staged publication after role-specific validation.

**Recommendation:** create reviewed, reusable material during role onboarding; personalise its selection, pacing and feedback from assessment evidence. Use realistic work interfaces and short narrated demonstrations. Spend human review effort on teaching accuracy and scoring rather than on cinematic production.

## What exists locally

The frontend admin already edits role content, skills/mappings, assessment arcs and prompts with draft/publish controls. RoleBatch supports sequential generation with attributable errors. The backend AI gateway records model, prompt version, token counts and user-scoped/shared cached results. Assessment runs store the answers and their review. The simulation module currently contains a README contract, not an implemented curriculum or mission engine. Video content administration exists; automatic curriculum/video production does not.

Relevant source files:
- `app/(admin)/admin/admin-console.tsx`, `role-batch.tsx`, `videos.tsx`.
- `../ascend-backend/src/modules/simulation/README.md`.
- `../ascend-backend/src/modules/ai-gateway/index.ts`.
- `../ascend-backend/src/modules/discovery/skill-model.ts`.
- `../ascend-backend/src/modules/assessment-review/index.ts`.

The local skill seed includes customer_care, planning, selling, composure, problem_solving, communication and follow_through. Published admin data must be the runtime authority; a local seed is not proof of current production mappings. The existing 0–3 role-skill levels express importance, not a student's proficiency or a passing threshold.

The existing simulation design prescribes three missions per anchor role. Expand these into three progression stages—guided, independent and transfer—with per-skill tasks and coverage requirements. A mission can cover several skills; retain a coverage matrix so no required skill disappears in a role-level average.

## Role onboarding and publishing

Add a Curriculum step after the admin confirms the role description and skill mappings:

1. Confirm role context, approved skill IDs, task families, expected performance and prerequisite foundation topics.
2. Show reusable published content and a coverage preview. Generate only missing content and role-specific examples. Propose new skills for admin approval; never silently invent canonical IDs.
3. Generate a curriculum outline: learning objectives, prerequisites, duration, lesson variants, simulations, rubrics and separate reassessment forms.
4. Find candidate YouTube resources by learning objective; show the reviewer why each is relevant and where its coverage is uncertain.
5. Generate original text lessons, a role video script/storyboard and simulated workplace resources.
6. Render one original 60–120 second video per role, with narration, captions, transcript, and a text equivalent. Optional skill-level clips can follow after the pilot proves useful.
7. Validate coverage, factual consistency, answerability, references, media availability and rubric alignment. A reviewer edits/approves the materials and watches every selected video.
8. Publish an immutable curriculum version. New enrolments get that version; active learners retain their version unless explicitly migrated. Never replace their lessons halfway through a mission.

Jobs must be durable, resumable and idempotent. The browser must not own the onboarding job lifetime. States: queued → generating → needs review → approved → published, with failed/retry states per item. Keep completed work when one video or model request fails. Re-run only the selected unit; show the estimated and actual cost. Role publishing can proceed independently, but simulations stay unavailable until their required curriculum passes review.

## Curriculum contents

| Unit | Required content | Reuse strategy |
|---|---|---|
| Role orientation | What the work involves; 60–120s original demonstration; glossary | Once per role/version/language |
| Skill lesson | Why it matters in this role; short explanation; good/weak example; checklist; quick retrieval question | Shared principle plus role context |
| External resource | One primary YouTube choice and one backup where suitable; provider/source attribution | Once per objective/language, reviewed and periodically refreshed |
| Guided simulation | Short brief, resources, work action, consequences, coaching, retry | Approved task family with controlled variants |
| Independent simulation | Different facts, same objective, reduced guidance | Per-skill evidence, not memorised answers |
| Transfer task | New customer/problem/context; integration with other relevant skills | Confirms the skill transfers beyond one lesson |
| Reassessment | Unseen, comparable tasks; private rubric; no worked solution leakage | Separate forms from teaching material |

Do not require video viewing as evidence of mastery. Offer text for bandwidth, accessibility and learning preference; assess the work produced.

**YouTube quality controls:** use the official search API with video-only and embeddable filters, duration/language restrictions, caption availability where possible, and task-specific searches. Relevance should consider objective coverage, student suitability, clarity, factual accuracy, freshness where needed, and the creator's credibility—not views alone. A model can rank title/description candidates but cannot certify the full lesson from metadata. Publish only after human review or an authorised full-content review. Embed the official player; preserve its controls/attribution/ads. Do not scrape or redistribute video files. Official caption download requires permission to edit the source video, so arbitrary third-party transcripts are not a dependable input. Keep an original text lesson and a replacement link for unavailable, region-restricted or newly unembeddable videos. Check retained metadata and refresh/deletion requirements against YouTube policy when implementing the cache.

**In-house video:** use reusable animated workplace screens and diagrams, an original script, narration and timed captions. Example 90-second structure: 0–15s work context; 15–40s a realistic mistake; 40–75s demonstrate a better response; 75–90s checklist and the upcoming task. Render only after script approval, in a background worker. Reuse the app's existing speech capability if it meets the quality/cost target; Google TTS below is a pricing benchmark, not a required new vendor. Avoid a generated avatar or cinematic footage in the first release.

## Generic learning without duplicate courses

Maintain a shared foundation library: clear communication, professional email, concise writing, asking useful questions, listening/clarification, work updates, handover notes and basic digital-work hygiene. Foundations are learning objectives under approved parent skills, not automatically new scored skills.

At role onboarding, match these objectives against role units. Attach an existing approved foundation when it is missing; omit duplicate teaching when the role course already covers it. Reuse a learner's demonstrated mastery only when the target and rubric are compatible; otherwise use a short diagnostic. For example, good written communication does not by itself verify spoken communication. Never score accent or penalise accessibility needs.

## Personal plan from gaps and commitment

Read the latest valid completed assessment for the selected role, its evidence coverage, confidence and benchmark version. Do not use a different role's result or an abandoned sitting. Missing evidence means unknown, not zero. Low-confidence gaps trigger a short diagnostic before prescribing a large course.

Ask minutes per session, days per week, target date, language and preferred format. Plan scheduling is deterministic; AI may explain it. Rank work using role importance, demonstrated gap and prerequisites, while separately prioritising uncertain evidence for diagnosis. Shorter commitment changes the calendar, not the passing standard. If a requested deadline is unrealistic, show the required weekly time and a later achievable date.

Show one next session with a concrete reason, e.g. “Your last customer reply did not give a next step. Today: practise closing the loop.” Let learners pause, reschedule and change commitment. Replan unfinished work after new evidence or a changed schedule; retain completed work and version the plan changes. A missed day moves the schedule; it does not reduce readiness.

Personalise examples, language, explanation length, scaffolding and selected practice variants. Keep learning objectives and assessment standards fixed. Cache non-personal explanations by role/skill/objective/version/language; keep all learner-specific feedback and answers scoped to that learner. Generate small just-in-time remediation, not an entire private course. If AI fails, save the attempt and offer an approved explanation while feedback is pending.

## Concrete pilot: Customer Success Associate

Use actual published role mappings before enrolling anyone. Start with customer care, communication, problem solving and follow-through if confirmed by admin.

Example planning envelope: 20 minutes × 4 days/week × 4 weeks = 320 minutes. This is illustrative scheduling, not a promised time to mastery.

| Week | Work to practise | Evidence |
|---|---|---|
| 1 | Clear email and useful clarification | Rewrite a confusing reply; ask a focused question |
| 2 | Responding to a frustrated customer | Acknowledge the issue, explain the action, set a realistic expectation |
| 3 | Investigating a problem and following through | Use an order history, choose a next step, write a handover/update |
| 4 | Integrated cases and fresh reassessment | Independent work with changed facts; compare against the same targets |

Example unit: **Give a customer a clear next step.** Explain “customer case” before introducing “ticket.” Supply an order card, short company policy and a customer message. Ask the student to write a reply and update the case. The rubric checks acknowledgement, correct use of facts/policy, a specific next action, realistic timing and professional clarity. A guided retry receives feedback on the missing criterion. An independent later case changes the product, deadline and customer circumstances. Do not reward copying the worked example.

Build simulations as reusable mobile-friendly interfaces: inbox/reply, case board, priority queue, handover note and a small spreadsheet/table task. Decisions change the scenario and produce consequences. AI may play a customer within an approved state and policy; it must not invent policy or own unrestricted scenario state. Avoid an open chatbot as the only definition of “simulation.”

## Reassessment and productivity readiness

Retain the 12-question role assessment convention, using an unseen equivalent form after the course. Each scored skill also needs repeated independent evidence from simulations, at least across distinct task situations. Exact coverage and verification thresholds need pilot calibration. Guided and independent attempts must be labelled separately.

The current assessment review reads all answers in one model request and saves model-returned review fields. For defensible baseline-to-final comparisons, introduce a versioned criterion-evidence layer and deterministic aggregation. Do not blindly compare two free-form AI percentages. Either re-evaluate stored baseline evidence with the new rubric or mark the old and new scores as not directly comparable.

Store the submitted artifact, scenario/version, criterion observations, evidence spans, assistance state, rule version and review confidence. AI proposes evidence-backed observations; validated rules calculate the skill scores, role-weighted result and coverage status. Arithmetic determinism does not make AI judgement objective: benchmark observations against human-rated answers and route uncertainty/disagreement for review. Do not expose private criteria or answers to teaching generation or learner-facing endpoints.

A critical required skill below its threshold must remain visible even when other skills are strong. Insufficient evidence produces a provisional result rather than a confident “ready” badge. Course completion and watch time never increase the score. Preserve baseline and final snapshots; employers see evidence only with the learner's consent.

Report UI: overall score and evidence confidence, before/after radar chart, per-skill bars against role targets, strengths, the two most consequential remaining gaps, and a specific next practice CTA. Provide an accessible text/table equivalent to charts. Label it **Productivity readiness — demonstrated in Ascend simulations**: it is an estimate from simulated work, not proof of workplace performance. Validate the relationship to workplace outcomes before making that stronger claim.

## Backend and frontend work

Keep this in the existing modular backend, not Next.js business APIs. Proposed responsibilities:
- Curriculum ownership: versioned units, objective mappings, media metadata, review/publish records and generation jobs.
- Simulation ownership: mission definitions, constrained scenario state, attempts, feedback and evidence.
- Learning-plan ownership: user commitment, enrolment/version, schedule and plan revisions.
- Assessment ownership: fresh forms and comparable final assessment evidence.
- Scoring/verification: versioned rubric/benchmark ownership with evidence-linked results; access across modules only through their public interfaces.

Use durable PostgreSQL-backed jobs initially, with a separate worker process for generation/rendering in the same codebase. Avoid introducing a separate queue service before volume warrants it. Add the new tables through backend migrations with RLS, single-module ownership, user access controls and audit history. Never use one mutable content document as the storage for all personal attempts and progress.

Frontend additions: admin curriculum step/editor/review screen; student plan and commitment controls; lesson/media view; mission workspace; focused feedback/retry; final report. Content and attempts must autosave. Payment/entitlement checks remain server-side. All material must have captions/text alternatives, 360px layouts and keyboard access.

## Cost model in INR

Planning conversion: **₹90 per USD**, an explicit budgeting assumption, not a live FX quote. Before tax, payment/FX fees, salaries, human review and existing platform bills. Figures are not measured Ascend production usage. No free tiers or prompt-cache savings are assumed.

Price references checked 12 September 2026: Haiku 4.5 $1/$5 per million input/output tokens; Sonnet 4.6 $3/$15; Opus 5 $5/$25. These models are already referenced in local source. Offline batch content generation can receive a 50% token-price discount. Selection of a cheaper grader must pass the same quality benchmarks first. [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing), [batch processing](https://platform.claude.com/docs/en/build-with-claude/batch-processing).

Illustrative **one complete learner-month** (one course, not unlimited practice):

| Work | Explicit usage assumption | INR |
|---|---|---:|
| Practice feedback, including retries | 24 Haiku calls × 6,000 input + 800 output tokens | 21.60 |
| Personalised explanations | 4 Haiku calls × 4,000 input + 800 output | 2.88 |
| Final reassessment evidence review/report | 1 Opus call × 20,000 input + 4,000 output | 18.00 |
| Complex-case second review | 1 Opus call × 8,000 input + 1,200 output | 6.30 |
| AI subtotal | No caching discount | 48.78 |
| Retry/usage allowance | 25% of AI subtotal | 12.20 |
| Own-video delivery | 20 delivered minutes × $0.001 × ₹90 | 1.80 |
| Variable total | Rounded | **62.78** |

Reassessment retains the current grouped-review approach, not 12 separate premium calls. 4,000 output tokens is a planning target; the current assessment review permits 8,000, so measure actual usage. A long voice-chat simulation or unlimited retries is outside this envelope. Starting assessment cost is excluded because the learner already completed it. Every additional full course adds its own usage.

Cloudflare Stream benchmark: $5/month for a 1,000-minute storage block (₹450; do not prorate a smaller library below this minimum) and $1 per 1,000 delivered minutes. At 20 delivered minutes per learner, delivery is ₹900 for 500 learners and ₹1,800 for 1,000, already included above. Buffering/preloading counts, so avoid automatic playback. This is a benchmark option, not an instruction to replace existing storage. [Stream pricing](https://developers.cloudflare.com/stream/pricing/).

| Monthly load | Modelled variable cost | + storage block + ₹3,000 incremental worker/ops allowance | Suggested planning envelope |
|---|---:|---:|---:|
| 500 full-course equivalents | ₹31,388 | ₹34,838 | **₹35,000–₹50,000** |
| 1,000 full-course equivalents | ₹62,775 | ₹66,225 | **₹65,000–₹95,000** |

The ₹3,000 worker/ops allowance is an engineering estimate, not a provider quote. Existing Supabase/Render/Vercel capacity must be checked before claiming no additional cost. Monthly active learners are not necessarily full-course equivalents; session/attempt counts are the billing driver. Human escalations/support are additional. Revisit these envelopes with measured pilot data before setting a selling price.

One-time new-role content budget: **₹300–₹1,000 automated generation/rendering allowance**, assuming reusable templates, several skill units and multiple revisions; **₹2,000–₹8,000 human review allowance** assuming 4–8 hours at ₹500–₹1,000/hour. These are planning allowances, not quotes or API tariffs. Reuse of already reviewed foundation units reduces the work; specialist roles and localisation increase it. Scoring calibration across multiple human raters needs a separate pilot budget.

The voice is a small part of a video budget: 1,200–2,000 characters at Google Neural2's published $16/million characters is about **₹1.73–₹2.88** for one render, before retries/tax. This excludes script writing, visual rendering and review. [Google TTS pricing](https://cloud.google.com/text-to-speech/pricing). The existing speech integration may be preferable to another vendor; compare actual voice quality and usage before switching.

Engineering is the larger initial cost: a rough planning estimate is **20–30 experienced engineering days for a narrow end-to-end pilot**, and **40–60 total days for the wider production foundation**, plus content review and calibration. At an illustrative agreed rate of ₹5,000/day, that is ₹1–₹1.5 lakh for the pilot or ₹2–₹3 lakh for the broader foundation. This is arithmetic, not a hiring-market quote or delivery commitment; final scope and team availability determine it. No financial break-even claim is implied by these serving costs.

## Build order and release checks

1. Start with a customer-success vertical slice, but validate the architecture with a sales and a retail-management pack before treating it as a reusable solution. Confirm each role’s context, mappings and task standards with domain reviewers. Draft complete skill units and unseen reassessments before bulk generation. Roll out to every published admin role through the coverage register; the initial pilot does not reduce the all-role scope.
2. Implement reusable curriculum schema, resumable generation, review and publishing. Deliver original text, embedded candidate video links and a templated narrated role film.
3. Deliver baseline-to-plan scheduling and three reusable work interfaces. Preserve all user artifacts and give criterion-linked feedback with retry.
4. Add equivalent reassessment and versioned scoring with human-rated test cases. Pilot with 30–50 students before expanding to 500–1,000.
5. Add other roles by reusing approved foundations and interface templates, then add controlled personalisation and more media formats where evidence shows value.

Release criteria: every unit maps to approved skill IDs and an objective; every claimed gap has supporting assessment evidence or is labelled uncertain; every required skill has sufficient independent task coverage; score outputs are reproducible under a recorded rule version; video failures never block the text/work path; scenarios are solvable from provided facts; independent forms do not repeat the teaching answers; retries and plan changes preserve evidence; no learner data enters another learner's cache; costs are measured per role/course/learner. Benchmark AI observations against human-rated examples before deciding that a low-cost model is good enough. Keep underperforming content in review.

## External-resource references

YouTube supports embeddable video search; current documentation lists a default 100 search.list calls/day. Search during onboarding/refresh rather than per learner. Verify the project's actual quota in its console. [Search API](https://developers.google.com/youtube/v3/docs/search/list), [API quota overview](https://developers.google.com/youtube/v3/getting-started).

Third-party caption download is not generally available through the official API without permission to edit the video. [Caption download](https://developers.google.com/youtube/v3/docs/captions/download). Review embedding, metadata retention and player requirements during integration. [Developer policies](https://developers.google.com/youtube/terms/developer-policies).


## All-role coverage and meaningful outcomes — founder requirement

This requirement supersedes any interpretation that a generic communication course or a customer-service-only engine is sufficient. All existing and future roles in the published admin catalogue must be represented in the simulation coverage register. Generation, review and release may be staged; do not label an unreviewed or incomplete role as supported.

The local seed currently lists six roles and does not list Sales Representative or Retail Store Manager under those exact names. It is not the production catalogue. At implementation, read the actual published admin catalogue and its versions. Treat those two requested examples as required reference packs; do not quietly remap a store manager to retail sales or a sales representative to customer support.

**Role definition before generation.** Record the job family, sector/product, channel (store, field, phone, digital or B2B), seniority, decision authority, customers/stakeholders, tools, daily/weekly tasks, resources/policies, critical mistakes and expected work outputs. “Sales representative” alone is too broad to generate an accurate curriculum. Ask admin to confirm a proposed profile when these fields are absent. For a student targeting a management role, teach and assess supervisory work; show any experience/prerequisite gap separately rather than presenting a short course as equivalent to that experience.

Ground the profile in approved job descriptions, current occupational references and a practitioner’s review. For India, prefer relevant current NQR/sector-skill-council role standards as one reference, alongside actual employer contexts. These references inform original curriculum and do not imply accreditation, authorisation to reproduce course materials, or equivalence to an official qualification. Check version validity before using a standard in production.

**Coverage register per role/version.** Include role profile approval; required transferable and functional skills; task families; lesson/resource coverage; guided/independent/transfer practice; fresh reassessment; approved rubric; interview follow-up questions; reviewer; status and outstanding gaps. A role’s simulation pack cannot be published until every critical requirement has suitable assessed work. A missing inventory skill in the canonical catalogue is an admin action, not permission to label inventory as generic “problem solving” and declare coverage complete.

The current seven broad skill categories are not a complete functional job model. Extend the admin-owned skill catalogue with approved functional skills/subskills and role-specific proficiency targets. Reuse interface components and sound teaching principles; preserve role-specific tasks, constraints, decisions and criteria.

### Contrasting reference packs

These are proposed original situations, not already published missions or universal job descriptions. Product facts and company policies must be supplied inside each simulation.

| Dimension | Sales Representative — example B2B context | Retail Store Manager — example small store context |
|---|---|---|
| Core work | Understand need, qualify fit, explain value, handle objections, agree a next step and maintain the customer record | Allocate staff, maintain stock availability, manage service issues, interpret store performance and close the shift accurately |
| Resources | Lead cards, product facts, approved pricing/discount rules, customer history and a sales pipeline | Staff availability, sales/footfall table, inventory movements, return policy, margin data and handover log |
| Guided mission | A prospect asks for the cheapest option; uncover their actual need before recommending anything | Prepare the opening shift from staffing and stock information; explain why the plan works |
| Independent mission | Handle a competitor-price objection without inventing product claims or unauthorised discounts; record a specific agreed next step | During a rush, one employee is absent, a popular item is unavailable and a customer wants a return; allocate attention and follow the supplied policy |
| Transfer mission | A new segment/buyer has different priorities and rejects the original pitch; change the approach using the evidence | Sales are below plan despite increased footfall; examine conversion/availability clues, choose a response and write the next-shift action plan |
| Work artifacts | Discovery questions, conversation decisions, offer rationale, follow-up email and updated sales record | Roster, replenishment decision, exception handling, reconciliation/action note and shift briefing |
| Criteria | Need discovery, fit, accuracy, listening, commercial judgement, clear next action and follow-through | Prioritisation, stock/data accuracy, resource allocation, service judgement, people communication and operational follow-through |
| Failure to teach against | Pushing an unsuitable product, making a false promise, discounting without authority, recording a sale with no agreement | Ignoring a staffing bottleneck, ordering from the wrong stock measure, mishandling an exception or treating revenue as profit |
| Interview follow-up | “Why did you ask that question?” “What changed your pitch?” “What would you do if they still declined?” | “Why did you allocate staff that way?” “Which figure changed your decision?” “What did you hand over and why?” |

These task families are consistent with the broad responsibilities described in [O*NET’s non-technical sales profile](https://www.onetonline.org/link/summary/41-4012.00) and [India’s Retail Store Manager qualification description](https://nqr.gov.in/qualifications/11072). O*NET is a US occupational reference, not an Indian job specification. Sector/channel differences must be reviewed locally. The Indian role description specifically covers staffing, product availability, customer satisfaction and store financial performance; a store manager pack must go beyond customer conversation alone.

**Meaningful consequences.** Scenario rules determine inventory, authorised price changes, staffing capacity and available next actions. AI characters respond within those facts. A sale or customer reaction in one fictional branch is not itself proof of skill. Judge the learner’s reasoning and artifact against the approved criteria, and explain which decision caused the simulated consequence. Do not reward manipulation, exaggerated claims or reckless commercial choices merely because a branch reports higher revenue.

### An engaging practice loop that produces evidence

Open with a concrete assignment in a continuing fictional workplace. Briefly explain unfamiliar terms. Give the learner useful resources and an action immediately. Provide a short illustrated explanation or 30–60 second demonstration when it addresses a gap; keep deeper YouTube material optional. The full role orientation remains 60–120 seconds.

Use this sequence: try the work → see its consequence → receive one specific correction → retry with less support → handle changed facts → explain the decision. Each learning session should include a meaningful action or work artifact. Do not reduce every role to multiple-choice questions or a free-form chat.

Let episodes connect: a customer returns, a handover affects the next shift, or an earlier promise now needs fulfilment. Keep the fictional world clearly identified as a simulation. Use short sessions, automatic resume, visible evidence of improvement and reminders matched to the learner’s chosen schedule. Increase complexity as independent performance improves. Surface the next useful challenge; allow a completed learner to finish rather than extending the course to inflate retention. Calendar misses never erase earned competence.

### From practice to interview and workplace preparation

After an independent mission, ask the learner to explain their decision in 60–90 seconds. Reuse Ascend’s interview practice capability where suitable to ask realistic follow-up questions. Feedback should check whether the explanation is accurate, specific and supported by the saved work—not simply fluent or confident.

Create a learner-owned evidence card: simulated situation, responsibility, actions actually taken, measured simulation outcome and lesson learned. Help structure an interview answer from that evidence, explicitly introduced as an Ascend simulation. Never convert it into a claim of paid employment, real customers served, or real revenue generated. Sharing remains optional.

Build separate outcome views: role-task capability, ability to explain/defend decisions in an interview, and remaining prerequisites. A good interview answer cannot compensate for incorrect work, and correct work with weak explanation calls for interview practice rather than repeating the whole role course.

### Success measures and release decisions

Primary learning measures: improvement on unseen equivalent tasks under the same rubric; reduction in repeated critical errors; successful transfer to a changed situation; lower dependence on hints; and retention on a later short check. Interview measures: improvement in a blind-rated explanation and follow-up response, plus optional learner-reported interview outcomes. Productivity measures initially describe simulation performance; real workplace usefulness requires consented manager/employer feedback and contextual validation.

Engagement measures: meaningful task-start-to-submission conversion, return for the next scheduled practice, retry after specific feedback and completion of independent evidence. Track these alongside learning outcomes. High watch time or repeat visits with flat independent performance is a redesign signal, not success.

Use comparable baseline/final forms, a human-rated evaluation set, rubric/version records and randomised or matched evaluation where practical. Report uncertainty, missing outcomes and dropout rather than measuring only successful completers. Domain reviewers must confirm that critical errors and passing behaviours match the role. Define numerical release thresholds with that review and pilot evidence; do not invent a universal “job-ready” cut-off now.

**Budget implication:** the earlier per-role estimate describes a narrow pack with reusable material. A retail management pack needing new inventory/roster/reconciliation tools, additional functional skills and specialist review will cost more. Track each role’s content-review and interface-build effort separately. Reuse the work engine and approved assets; do not reduce job fidelity to preserve an unrealistically uniform cost per role.
