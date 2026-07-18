# GJR Build Playbook — Detailed Edition
**For a non-technical founder using Claude Code on Claude Pro.**
**Every session: exact commands, exact clicks, exact expected output, what to do if it looks wrong.**

---

## BEFORE YOU START — Tools You Need Installed

Open Terminal (Mac) or Command Prompt/PowerShell (Windows) and check each one. If a command fails with "command not found," install that tool first.

| Tool | Check command | Expected output | If missing |
|---|---|---|---|
| Node.js | `node -v` | `v20.x.x` or higher | Install from nodejs.org (LTS version) |
| npm | `npm -v` | `10.x.x` or higher | Comes with Node.js automatically |
| Git | `git -v` | `git version 2.x.x` | Install from git-scm.com |
| Claude Code | `claude -v` | a version number | `npm install -g @anthropic-ai/claude-code` |

Have ready, saved in a notes file, before you begin:
- Your Anthropic API key (console.anthropic.com → API Keys → Create Key — shown only once, save it immediately)
- A GitHub account (github.com — free)
- A Vercel account (vercel.com — sign up with GitHub, free)
- A Supabase account (supabase.com — sign up with GitHub, free)

---

## HOW SESSIONS WORK ON CLAUDE PRO

Pro refreshes your usage roughly every 5 hours. Each session below is sized to comfortably fit inside one window.

1. **Never paste giant files into Claude Code chat.** Say "read the file at [path]" — it reads from disk, which costs far less budget than pasting.
2. **If cut off mid-session:** open a fresh Claude Code session and paste:
   ```
   Continue the current task. First read CLAUDE.md and PROGRESS.md, then run npm test and npm run build, and tell me exactly what state the project is in before writing any new code.
   ```
3. **Don't chit-chat inside Claude Code sessions** — every message there costs budget (unlike here in claude.ai).
4. **Always verify before moving to the next session.** A broken foundation costs 5x more to fix later than to catch now.
5. **After every checkpoint**, the same 3 commands close out the session:
   ```bash
   git add .
   git commit -m "Session N: <short description>"
   git push
   ```
   I won't repeat this block every time below — just run it whenever a checkpoint says ✅.

---

## SESSION 0 — Project Setup (manual, no Claude Code yet)

The only fully manual session. Go slowly here — everything downstream depends on this being right.

### Step 0.1 — Create the Supabase Project
1. supabase.com/dashboard → **New Project**
2. Name: `gjr-employability`
3. Set a database password — **save it in your notes**, it's shown only once
4. Region: **Mumbai (ap-south-1)** if available, for lowest latency to India
5. **Create new project** → wait ~2 minutes

> If you already have a Supabase project from earlier GJR sessions, you can add these tables into it instead — nothing here clashes with your existing schema. A separate project is simpler to reason about for now; you can merge later.

### Step 0.2 — Get Your Supabase Keys
1. Left sidebar → gear icon **Settings** → **API**
2. Copy into your notes file:
   - **Project URL** — `https://abcdefgh.supabase.co`
   - **anon public key** — long string starting `eyJ...`
   - **service_role key** — click "Reveal" first — another long string starting `eyJ...`

⚠️ The service_role key bypasses all security rules. Never commit it, never share it, never use it in frontend code — only in server-only files.

### Step 0.3 — Create the Next.js App
```bash
npx create-next-app@latest gjr-employability
```
Answer the prompts:
```
TypeScript?          → Yes
ESLint?               → Yes
Tailwind CSS?         → Yes
src/ directory?       → No
App Router?           → Yes
Custom import alias?  → No
```
```bash
cd gjr-employability
```

### Step 0.4 — Install Packages
```bash
npm install @supabase/supabase-js @supabase/ssr @anthropic-ai/sdk zod
```
Expected: ends with `added 47 packages` (number may vary), no red "ERR!" text. Yellow warnings are fine.

### Step 0.5 — Environment File
```bash
touch .env.local
```
Open it in any text editor and paste in (replace with your real values from Step 0.2):
```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
ADMIN_EMAILS=your-email@example.com
```
`.env.local` is already in `.gitignore` by default from `create-next-app` — it will not be committed.

### Step 0.6 — GitHub + Vercel
```bash
git init
git add .
git commit -m "Initial setup"
```
GitHub → **New repository** → name `gjr-employability` → do NOT initialize with a README → Create. Then run the commands GitHub shows you (they'll include your actual username):
```bash
git remote add origin https://github.com/YOUR-USERNAME/gjr-employability.git
git branch -M main
git push -u origin main
```
Then vercel.com/new → **Import** the repo → add the same 5 env vars → **Deploy**. Wait ~2 minutes.

✅ **Checkpoint 0.6:** Vercel gives a live URL. Open it — default Next.js starter page should load. If it errors, check the Vercel deployment logs for a missing/misspelled env var (case-sensitive).

### Step 0.7 — Add the Guide Documents
```bash
mkdir docs
```
Save these into the project (I've written all three in our conversation — copy each into a new file):
- `CLAUDE.md` → project **root**, exact filename — Claude Code reads this automatically every session
- `docs/BUILD_GUIDE.md` → the PRD + Technical Architecture document
- `docs/PLAYBOOK.md` → this document

```bash
git add .
git commit -m "Add architecture docs"
git push
```

### Step 0.8 — Launch Claude Code
```bash
claude
```
Leave this session open for Session 1 below.

✅ **Session 0 done when:** Vercel shows the live starter page, GitHub has your first commit, `docs/` has all 3 files.

---

## SESSION 1 — Bootstrapping Claude Code + Progress Tracking

**Paste into Claude Code:**
```
Read CLAUDE.md and docs/BUILD_GUIDE.md fully. Summarize the architecture in 5 plain-English bullet points, no code yet — I want to check your understanding first.

Then:
1. Install and configure Vitest for this Next.js + TypeScript project. Add a "test" script to package.json.
2. Create PROGRESS.md at the project root listing all 18 sessions from docs/PLAYBOOK.md as an unchecked markdown checklist.
3. Run npm run build and npm test and paste both outputs so I can confirm zero errors.

From now on, at the end of every future session, check off the relevant PROGRESS.md box and commit it with the code.
```

**Read the 5 bullet points carefully** — they should cover evidence-first, AI-vs-rules separation, versioned rules, audit logging, and frozen passports. If anything sounds off, correct it before letting Claude write any code.

**Expected test output:**
```
No test files found
```
That's correct — no tests exist yet.

**Expected build output** ends with:
```
✓ Compiled successfully
```

✅ **Checkpoint:** open `PROGRESS.md` yourself, confirm 18 unchecked sessions listed.

---

## SESSION 2 — Database Schema + Seed Data

**Paste into Claude Code:**
```
Task: create the Supabase schema. Read docs/BUILD_GUIDE.md section "2.3 Database Schema" carefully.

1. Create supabase/schema.sql with all 12 tables and every RLS policy exactly as documented.
2. Create supabase/seed.sql with the seed data (1 target role, 5 dimensions, 5 rules).
3. Do NOT run these yourself — walk me through pasting them into the Supabase SQL Editor step by step, in plain language, since I'm non-technical.
4. After I confirm I've run them, create scripts/verify-db.ts using the service-role client that prints every table name with its row count.
5. Give me the exact command to run that script.

Update PROGRESS.md and wait for my confirmation before committing.
```

**You do, manually:**
1. Supabase dashboard → **SQL Editor** → **New query**
2. Open `supabase/schema.sql`, copy all, paste into the editor, click **Run**
3. Expected: green "Success. No rows returned." Red text → copy the exact error back to Claude Code, don't try to interpret it yourself
4. New query → paste `supabase/seed.sql` → Run → same success check
5. **Table Editor** in the sidebar should now list 12 tables: `target_roles`, `employability_dimensions`, `readiness_rules`, `students`, `student_employability_profiles`, `student_dimension_statuses`, `assessment_results`, `evidence_records`, `readiness_events`, `passport_snapshots`, `audit_log`, `recommendations`

**Run the verify script:**
```bash
npx tsx scripts/verify-db.ts
```
**Expected output:**
```
target_roles: 1 row
employability_dimensions: 5 rows
readiness_rules: 5 rows
students: 0 rows
student_employability_profiles: 0 rows
student_dimension_statuses: 0 rows
assessment_results: 0 rows
evidence_records: 0 rows
readiness_events: 0 rows
passport_snapshots: 0 rows
audit_log: 0 rows
recommendations: 0 rows
```

✅ **Checkpoint:** output matches this shape.

---

## SESSION 3 — Readiness Engine Part 1 (Status Logic + Tests)

The single most important file in your platform — the "brain" deciding job-readiness. It must be provably correct before anything else touches it.

**Paste into Claude Code:**
```
Task: implement /lib/readiness-engine.ts, function calculateDimensionStatus, per docs/BUILD_GUIDE.md section "2.4 The Readiness Engine". Requirements:
- Pure function: no database calls, no AI calls, no side effects, fully deterministic
- Effective score = mean of the top 3 valid evidence scores (valid = verified AND not expired)

Write tests in /lib/readiness-engine.test.ts covering ALL of these — don't skip any:
1. Zero evidence items → 'not_assessed', effectiveScore null
2. Evidence exists but none verified → 'not_assessed'
3. Evidence verified but all older than validity window → 'outdated'
4. Score 78, 2 valid items, threshold 70, min_evidence 2 → 'meets_standard'
5. Score 90, 3 valid items, strong_threshold 85, min_evidence 2 → 'strong'
6. Score 90 but only 2 valid items when strong needs min_evidence+1=3 → 'meets_standard', NOT 'strong'
7. Score 65 (below threshold 70) → 'developing'
8. Mix of 2 valid + 3 expired items → only the 2 valid ones feed the score
9. Score exactly equal to the threshold → counts as meeting it

Run npm test, paste full output. Every test must pass. If a test fails, fix the implementation, not the test — unless a test is factually wrong per the spec, in which case explain before changing it.

Update PROGRESS.md.
```

**Expected output** (wording may vary):
```
✓ lib/readiness-engine.test.ts (9 tests)
  ✓ returns not_assessed with zero evidence
  ✓ returns not_assessed when no evidence is verified
  ✓ returns outdated when all evidence expired
  ✓ returns meets_standard at score 78 with 2 items
  ✓ returns strong at score 90 with 3 items
  ✓ returns meets_standard not strong with only 2 items
  ✓ returns developing below threshold
  ✓ ignores expired evidence in score calculation
  ✓ counts exact threshold match as meeting standard

Test Files  1 passed (1)
     Tests  9 passed (9)
```

**Run it yourself too**, don't just trust the paste:
```bash
npm test
```

✅ **Checkpoint:** you see "9 passed (9)" with your own eyes.

---

## SESSION 4 — Readiness Engine Part 2 (PRI Score + Passport Eligibility)

**Paste into Claude Code:**
```
Task: add calculatePRI and isPassportEligible to /lib/readiness-engine.ts per docs/BUILD_GUIDE.md section 2.4.

calculatePRI: weighted average of effective scores, mapped from 0-100 to 300-800.
Rule: a null effectiveScore (not_assessed or outdated) contributes 0 to the numerator but its weight still counts in the denominator — intentional, an unmeasured dimension drags the score down.

Write tests I can verify by hand:
1. All dimensions null → PRI = 300 exactly
2. All dimensions at effectiveScore 100 → PRI = 800 exactly
3. Two dimensions — weight 1.5 at score 100, weight 0.5 at score 0 — show the hand arithmetic in a test comment: (1.5*100 + 0.5*0)/(1.5+0.5) = 75%, so PRI = 300 + 0.75*500 = 675 — assert exactly 675
4. isPassportEligible: empty array → false; all meets_standard/strong → true; one still developing → false

Run npm test, paste full output — all tests including Session 3's must stay green. Update PROGRESS.md.
```

✅ **Checkpoint:** all tests pass, including Session 3's. **Your platform's mathematical core is now proven correct.**

---

## SESSION 5 — Assessment Intake API (Rules Only, No AI Yet)

**Paste into Claude Code:**
```
Task: build POST /api/assessments WITHOUT the AI step (added next session, deliberately separated so we can test the core flow first).

1. Create /lib/supabase-admin.ts — server-only Supabase client using the service role key. Add a comment warning this must never be imported into a client component.
2. Implement the flow from docs/BUILD_GUIDE.md section "2.6 The Critical Flow", skipping step 3 (AI):
   - Validate the body with zod: student_id, dimension_id, assessment_type, raw_score, max_score, submission_payload
   - Insert into assessment_results
   - Insert into evidence_records (verified = true, since it's a real assessment)
   - Insert into readiness_events ('assessment_completed', 'evidence_created')
   - Fetch valid evidence for that student+dimension, fetch the active rule
   - Run calculateDimensionStatus
   - Update/insert student_dimension_statuses
   - If status changed, insert audit_log with before/after
   - Recalculate PRI across all dimensions, update student_employability_profiles including passport_eligible
   - Return JSON: { new_status, pri_score }
3. Create scripts/seed-test-student.ts inserting one row into students and student_employability_profiles with a fixed UUID, printed clearly.
4. Give me the exact command to run the seed script, then 3 curl commands using that UUID walking the Communication dimension from not_assessed → developing → meets_standard, with the exact Supabase table+row to check after each.

Update PROGRESS.md.
```

**Run the seed script:**
```bash
npx tsx scripts/seed-test-student.ts
```
Expected: prints something like `Test student created: 11111111-1111-1111-1111-111111111111` — **save this UUID**, you'll reuse it constantly.

**In a separate terminal tab, start the dev server:**
```bash
npm run dev
```

**Run curl 1** (Claude fills in the real UUIDs — shape looks like):
```bash
curl -X POST http://localhost:3000/api/assessments \
  -H "Content-Type: application/json" \
  -d '{"student_id":"YOUR-UUID","dimension_id":"COMM-DIM-UUID","assessment_type":"quiz","raw_score":55,"max_score":100,"submission_payload":{}}'
```
**Expected response:**
```json
{"new_status":"developing","pri_score":312}
```
Run curls 2 and 3 as given, expecting `"new_status":"meets_standard"` eventually. After each, glance at `student_dimension_statuses` in Supabase Table Editor — the status column should visibly update.

✅ **Checkpoint — your first true end-to-end working feature.** A real assessment now flows all the way to a readiness status with a full audit trail, using the core proven in Sessions 3–4.

---

## SESSION 6 — AI Evaluation Layer

**Paste into Claude Code:**
```
Task: /lib/ai-evaluator.ts per docs/BUILD_GUIDE.md section 2.5.

- Model routing: claude-haiku-4-5 for quiz/written_task, claude-sonnet-4-6 for mock_interview/simulation
- Returns strict JSON: { raw_score, strengths: string[], gaps: string[], student_summary, improvement_action }
- Constant PROMPT_VERSION = "PV-1.0" stored with every result
- Invalid JSON → retry once with a stricter instruction → still invalid → return null
- API error (network, auth, rate limit) → catch, return null, never throw

Write a test mocking the Anthropic client covering: valid JSON parses, malformed JSON retries then returns null, an API error returns null without throwing.

Wire into step 3 of /api/assessments (skipped last session):
- Success: store ai_feedback + ai_prompt_version on the assessment_results row; if status is 'developing', insert a recommendations row using improvement_action
- Null: log a warning, continue the rest of the flow untouched — a broken AI call must never block a status update

Give me one curl command to re-test with a written_task, and tell me exactly where in Supabase to find the ai_feedback. Update PROGRESS.md.
```

**Run the curl**, then Supabase Table Editor → `assessment_results` → newest row → `ai_feedback` cell. Expected shape:
```json
{"raw_score": 72, "strengths": ["Clear structure"], "gaps": ["Missing greeting"], "student_summary": "Good effort...", "improvement_action": "Add a proper greeting line"}
```

**Resilience test (do yourself):** in `.env.local`, change one character of `ANTHROPIC_API_KEY`, restart `npm run dev`, run the curl again. Expected: `ai_feedback` stays null on the new row, but `new_status` in the response still updates correctly. **Then restore the real key and restart.**

✅ **Checkpoint:** real AI feedback appears in the database, and you've proven the system survives an AI outage.

---

## SESSION 7 — Auth (Student Login)

**Decision first — email OTP vs phone OTP:**

Email OTP needs zero extra setup and works today. Phone OTP matches how your Tier-2/3 users actually behave, but requires connecting an SMS provider (commonly Twilio) in Supabase → Authentication → Providers, plus a small per-SMS cost (~₹0.60/SMS via Twilio in India) and its own signup.

**Recommendation for the pilot: start with email OTP.** It gets you to a working, testable login today; you can add phone OTP as a drop-in swap later (the underlying students table and RLS policies don't change either way) once you've validated the rest of the flow and are ready to onboard real shop-floor users.

**Paste into Claude Code:**
```
Task: Supabase Auth using email OTP (magic link / one-time code) — no dashboard yet, just the login flow.

1. /login page — email input, sends OTP
2. Auth callback route completing the session
3. Middleware protecting everything under /dashboard/*
4. Logout
5. On first login, an onboarding step inserting a row into students and student_employability_profiles for that user
6. Note in a comment where to swap in phone OTP later (Supabase's phone auth API is a near drop-in replacement)

Update PROGRESS.md.
```

**You verify:** go to `/login` on your deployed Vercel URL (or `localhost:3000/login`), enter your own real email, check your inbox for the code/link, log in. Then check Supabase Table Editor → `students` — your row should exist.

✅ **Checkpoint:** you personally logged in and see your own student row in Supabase.

---

## SESSION 8 — Dashboard: Dimension Cards + Status

**Paste into Claude Code:**
```
Task: /dashboard dimension cards only (PRI dial comes next session).

Server component fetching the logged-in student's student_dimension_statuses joined with dimension names, via RLS (not the service role — this must respect the student's own permissions).

One card per dimension: name, status badge (not_assessed = gray, developing = amber, meets_standard = green, strong = purple, outdated = red), score, evidence count.

Mobile-first. Before styling, read the frontend-design skill's conventions and apply the GJR purple design system.

Also: give me 2 curl commands (reusing scripts/seed-test-student.ts's UUID, or my real logged-in student's UUID if I give it to you) to post assessments so I have live data to look at.

Update PROGRESS.md.
```

**To find your real student UUID:** Supabase Table Editor → `students` table → find the row matching your login email → copy its `student_id`.

✅ **Checkpoint:** open `/dashboard` on your phone (or resize your browser narrow) — you see your own live dimension statuses, correctly color-coded.

---

## SESSION 9 — Dashboard: PRI Dial + Next Best Action

**Paste into Claude Code:**
```
Task: add to /dashboard:
1. PRI dial at top — semicircular gauge 300-800, score centered, animates on load, shows "Not yet scored" when null
2. Next Best Action card — the student's top open recommendation, with a link
3. Empty state when there are no recommendations yet

Update PROGRESS.md.
```

**You verify:** note your current PRI, run one more curl posting an assessment, refresh `/dashboard` — the dial should visibly move to the new number, matching what `calculatePRI` would compute by hand for your data (you can sanity check using the formula from Session 4).

✅ **Checkpoint:** the dial moves when you post an assessment.

---

## SESSION 10 — Evidence Drill-Down (the "why" page)

This page is what makes the platform evidence-first in practice — a student (or auditor) must be able to see exactly *why* a status is what it is.

**Paste into Claude Code:**
```
Task: /dashboard/dimension/[id].

Header: dimension name, current status, effective score, and the rule applied in plain language — e.g. "Needs 2 pieces of evidence scoring 70+ within the last 90 days."

Body: evidence timeline, newest first — date, assessment type, score, evidence_summary, with expired items visually grayed and tagged "expired."

Below that: the latest ai_feedback for this dimension, rendered as Strengths / Gaps / Summary sections, not raw JSON.

Update PROGRESS.md.
```

✅ **Checkpoint:** tap into a dimension card from your dashboard — you can read the complete, plain-language story of why you have the status you have.

---

## SESSION 11 — Admin: Access + Dimensions Config

**Paste into Claude Code:**
```
Task: /admin protected by the ADMIN_EMAILS env var (comma-separated list, checked in middleware — reject anyone not on the list).

Page: dimensions table — edit name, weight, active flag. Writes go through a server action using the service-role client. Every change writes to audit_log with actor 'admin:<email>'.

Update PROGRESS.md.
```

**You verify:** confirm your own email is in `ADMIN_EMAILS` in `.env.local` (and in Vercel's env vars if testing on prod). Visit `/admin` logged in as yourself — should work. Open an incognito window, log in with a different email — should be redirected away. Edit a dimension's weight, then check `audit_log` for the new row.

✅ **Checkpoint:** access control works both ways (you're in, others are out), and edits are logged.

---

## SESSION 12 — Admin: Versioned Rules Editor

**Paste into Claude Code:**
```
Task: /admin/rules.

Show the active rule per dimension (version, threshold, strong_threshold, min_evidence_count, validity_days).

Editing must NEVER update a row in place: Save inserts a new row with version+1 and sets the previous row active=false, inside a database transaction, with an audit_log entry recording before/after.

After save, show a "Recalculate all students" button — a server action that reruns the readiness engine for every student × dimension and updates statuses, PRI, and audit_log accordingly.

Update PROGRESS.md.
```

**You verify:** change the Communication threshold from 70 to 75, save, click Recalculate, then check your own `/dashboard` — if your score was between 70 and 75, your status should have just dropped. Check `readiness_rules` table — you should see version 2 with the old version 1 now `active = false`, not overwritten. Check `audit_log`. **Change it back to 70 afterward** to restore your test data.

✅ **Checkpoint:** a threshold change ripples through correctly, and the old rule is preserved, not lost.

---

## SESSION 13 — Admin: Student List + Audit Viewer

**Paste into Claude Code:**
```
Task: /admin/students — table of students showing PRI, overall status, passport_eligible, last_assessed_at, with a cohort filter.

Row click → /admin/students/[id]: dimension statuses plus the full audit_log timeline for that student, newest first, with before/after states rendered readably (not raw JSON dumps).

Update PROGRESS.md.
```

✅ **Checkpoint:** find your test student in the list, click through, and read their complete history in plain language.

---

## SESSION 14 — Passport: Publish

**Paste into Claude Code:**
```
Task: passport publishing.

On /dashboard, when profile.passport_eligible is true, show a "Publish My Passport" card with a consent checkbox: "I agree to share my verified readiness via a link I control."

POST /api/passport/publish:
- Re-verify eligibility server-side with isPassportEligible — never trust a client-side flag
- Require consent = true
- Freeze snapshot_data: name, role, PRI, and per-dimension status + score + evidence count + latest evidence date. Explicitly exclude raw submissions and verbatim AI feedback — only the summary-level facts.
- Generate share_token, write audit_log 'passport_publish'

To test end to end, give me curl commands to push my test student to meets_standard on all 5 dimensions so passport_eligible flips to true.

Update PROGRESS.md.
```

✅ **Checkpoint:** after running the curls and publishing, check Supabase `passport_snapshots` — a row exists with a token and frozen JSON.

---

## SESSION 15 — Passport: Public Page + Revoke

**Paste into Claude Code:**
```
Task:
1. Public page /passport/[token] — no login required. Shows: student name, target role, PRI dial, dimension statuses with evidence counts and dates, a "Verified by GetJobReady.ai" badge, published date. Reads ONLY snapshot_data — never live tables. Unknown or revoked token → 404. Should look polished enough to hand to an employer; mobile-first.
2. Revoke button on /dashboard — sets revoked=true on the snapshot, writes audit_log 'passport_revoke'.

Update PROGRESS.md.
```

**You verify:** copy your share link into an incognito window — it should render cleanly with no login prompt. Go back to `/dashboard`, click Revoke, refresh the incognito tab — should now show 404. Publish a fresh one afterward so you have a working passport again for later testing.

✅ **Checkpoint:** the link works publicly and dies instantly on revoke.

---

## SESSION 16 — Hardening Pass

No new features this session — just making what exists safe to put in front of real users.

**Paste into Claude Code:**
```
Task: hardening pass, no new features.
1. List every API route and server action and confirm each has zod validation on its input — fix any that don't.
2. Add basic rate limiting on /api/assessments (per-student, 30/hour is enough for a pilot).
3. Grep the codebase for any use of the service-role client outside server-only files, and fix any leaks into client components.
4. Add error boundaries and friendly error states to /dashboard and /passport/[token] — no raw stack traces should ever be visible to a user.
5. Run npm run build, fix every type error until it's clean.
6. Write docs/RUNBOOK.md covering: how to add a new admin, how to rotate the service-role key if it leaks, how to force a recalculation, and how to use audit_log to investigate a status a student is disputing.

Update PROGRESS.md.
```

**You verify:** send a deliberately broken curl (missing a required field) and confirm you get a clear 400 error, not a crash:
```bash
curl -X POST http://localhost:3000/api/assessments -H "Content-Type: application/json" -d '{}'
```

✅ **Checkpoint:** build is clean, bad input fails gracefully, and `docs/RUNBOOK.md` exists for when something goes wrong at 11pm during the pilot.

---

## SESSION 17 — Integration Helper + First Real GJR Module

**Paste into Claude Code:**
```
Task: create /lib/submit-assessment.ts — a typed helper any GJR module can import and call to post to /api/assessments — plus docs/INTEGRATION.md documenting the dimension_id + assessment_type mapping table from docs/BUILD_GUIDE.md "Phase 6", with a copy-paste example per module.

Then wire ONE real module: [tell Claude Code exactly which existing GJR engine you're connecting first, and where its completion handler currently lives in your codebase].

Update PROGRESS.md.
```

✅ **Checkpoint:** complete a real activity inside GJR (not a curl — the actual student-facing feature) and watch your `/dashboard` update within a minute.

**Repeat this session's pattern** for each remaining GJR module — one per session if your Pro budget is tight, two if comfortable. Verify each one before starting the next; don't batch them blind.

---

## SESSION 18 — Pilot Readiness Check

**Paste into Claude Code:**
```
Task: pre-pilot audit.
1. Run all tests, report results.
2. Create scripts/smoke-test.ts exercising the full golden path end to end: create a fresh student → post 2 assessments per dimension → verify meets_standard everywhere → publish passport → fetch the public page → revoke → confirm 404 — printing PASS/FAIL per step.
3. Check every table for expected data shapes; flag any orphaned rows.
4. Write docs/PILOT_CHECKLIST.md: confirm all env vars are set correctly on Vercel production, Supabase backups are enabled, ADMIN_EMAILS is correct, and what to check daily during the pilot.

Update PROGRESS.md, and give me the one command to run the smoke test against production.
```

✅ **Checkpoint:** the smoke test shows all PASS against your live Vercel URL. **You are pilot-ready.**

---

## QUICK REFERENCE — SESSION MAP

| # | Deliverable | You verify by... |
|---|---|---|
| 0 | Project + Supabase + GitHub + Vercel live | starter page loads on your Vercel URL |
| 1 | Test runner + progress tracking | `npm test` runs clean |
| 2 | Full schema + seed data | verify-db.ts shows 12 tables with correct counts |
| 3 | Readiness status logic + tests | 9/9 tests pass |
| 4 | PRI + passport eligibility + tests | tests pass, math checked by hand |
| 5 | **Intake API end-to-end (rules)** | curl moves a real status |
| 6 | AI feedback layer + resilience | real feedback stored; survives a broken API key |
| 7 | Auth | you log in with your own email |
| 8 | Dimension cards | live statuses on your phone |
| 9 | PRI dial + next action | dial moves after a curl |
| 10 | Evidence drill-down | you can read the "why" |
| 11 | Admin access + dimensions | in/out access control works |
| 12 | Versioned rules + recalc | threshold change ripples, old version preserved |
| 13 | Student list + audit viewer | full history readable |
| 14 | Passport publish | snapshot + token exist |
| 15 | Public passport + revoke | link works, dies on revoke |
| 16 | Hardening + runbook | bad input → clean 400, not a crash |
| 17 | Integration + real modules | a real GJR activity updates the dashboard |
| 18 | Smoke test + pilot checklist | all PASS on production |

## PACING

- Comfortable: 1 session/day → ~3 weeks to pilot-ready
- Aggressive: 2 sessions/day (separate Pro windows) → ~10 days
- **Protect Sessions 3–5 especially** — do them fresh, verify hard, don't rush. Every later session trusts what they prove.
