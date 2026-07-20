# RELEASE_NOTES.md

Product-facing summary of what's been built so far. For the technical commit-level detail, see `CHANGELOG.md`.

## Current state: Post-Session-8 Stabilization Baseline (2026-07-20)

GetJobReady.ai's foundation is in place: a student can log in with just their email, and see a dashboard showing all 5 employability dimensions (Communication, Digital Skills, Interview Readiness, Workplace Behaviour, Professional Profile) with a live, correctly color-coded readiness status for each — "Not Assessed" by default, updating automatically as real assessment results are submitted to the platform.

**What works end-to-end today:**
- **Login.** A student enters their email, receives a login link, and is signed in — no password to remember. Works within Supabase's free-tier constraints (no paid email service required).
- **Dashboard.** Every logged-in student sees all 5 readiness dimensions with their current status, score, and evidence count.
- **The readiness engine.** The core scoring logic (what makes a status "Meets Standard" vs "Developing" vs "Strong") is fully built, tested, and provably correct — 18 automated tests cover every rule.
- **Assessment intake.** Any GJR module can submit a completed assessment (quiz, interview, task) to one API endpoint, and the platform automatically creates evidence, recalculates the student's readiness, gets AI-generated feedback, and logs an audit trail — all in one call.
- **AI feedback.** Claude grades submissions and writes encouraging, specific feedback — but never decides a student's status itself; that's always a deterministic rule, so "why am I at this status" always has a traceable, auditable answer.

**What this session specifically fixed:** the login flow had several rounds of debugging before landing on its final, stable form — the underlying cause was a real Supabase platform policy change (free-tier email template customization was removed in June 2026) that required a genuine redesign, not a patch. Separately, the dashboard appeared to have lost its Session 8 work; it hadn't — a database permissions setting had drifted independently of any code change. Both are now root-caused, fixed, and documented so they don't recur or get re-litigated from scratch in a future session.

**Not yet built:** the PRI score dial, the "why is my status what it is" evidence detail page, the admin panel (dimension/rule configuration, student list, audit viewer), and the shareable passport feature. These are Sessions 9 through 18 of the build plan — see `SESSION_PROGRESS.md` for the exact sequence.

**Known limitation to be aware of:** because this project intentionally avoids paid Supabase features during MVP development, real login testing is limited to a handful of email sends per hour (Supabase's free built-in email service is deliberately rate-limited). This is expected and will be resolved by adding a proper email provider (Resend) before the platform goes to real users.
