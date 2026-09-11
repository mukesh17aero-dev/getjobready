# Interview workspace design handoff

Standalone preview: `/previews/ascend-interview-workspace.html`.

| Existing route | Preview anchor | Proposed experience |
| --- | --- | --- |
| `/interview` | `#home` | One prominent mock-interview action, focused question practice, previous feedback and two useful follow-ups. |
| `/interview/practice` | `#practice` | Role, round, interviewer and voice/typing in a compact setup; JD/focus in optional disclosure. |
| Active interview | `#room` | One active question, editable transcript, clear send/next action, previous answers in a disclosure. |
| Interview feedback | `#feedback` | Keep/improve/next action, qualitative answer-level evidence and full transcript on demand. |
| `/interview/questions` | `#questions` | Search, round and competency filters, constructive status labels, two-column desktop cards and six entries per page. |
| Saved interviews | `#history` | Each interview retains its own role, round, date, transcript and feedback. |

All sample responses, progress, history, timing and feedback are explicitly illustrative. Local drafts persist only until reload. There are no microphone permissions, audio capture, AI requests, payments or account changes in the preview.

## Preserve current behaviour while changing the presentation

- Keep live setup options: selected/alternate role, optional JD, HR/managerial round, Asha/Ravi, focus, voice or typing. The live server generates questions; the HTML uses three fixed example questions and does not adapt them to input.
- Retain actual voice permission, recording/stop, server transcription, editable transcript and send states. Permission is requested only when the user chooses the voice check. Handle blocked/missing devices and unavailable speech with a typing fallback. The preview's ready/blocked buttons are state demonstrations only.
- Use server session timing and progress. The preview's "10:00 demo clock" must not become a real timer. Don't imply that navigating away pauses an interview unless the backend supports it. Respect the actual session cap, completion and early-end semantics.
- Preserve sign-in context and local drafts when starting/submitting requires authentication. Show missing-role, API-error, loading, review-pending and retry states with recovery. No new auth implementation is proposed.
- Use `InterviewSummaryView`'s actual qualitative fields. The present API does not return an interview percentage; do not invent a score or convert feedback prose to numbers on the frontend. Map per-question feedback to its original transcript turn, never to an unrelated latest interview.
- The question library API already supplies `weak`, `solid`, `unattempted`, attempts and a note. Display them as **Needs practice**, **Holding up**, **Not tried yet**, preserving the original backend values. Keep uncertain feedback distinct from a failed answer. Update progress only on a successfully returned review.
- Use backend question-bank competencies. These are not new admin readiness skill IDs. Carry the selected question's focus into the next mock interview without falsely claiming cross-skill scoring.
- On mobile, collapse decorative interviewer art, retain response controls, and use one question card per row. Six-card pagination prevents a long continuous library. Real draft persistence and history remain backend-owned; the HTML's in-memory state is not a production autosave solution.

## Scope and verification

Only separate preview files were added. The current routes/components and their API types were read; the live question-library screen was inspected. Browser interference prevented a full live walkthrough of `/interview` and `/interview/practice`; no live interview was started for this task. The new standalone home and setup were checked in Chrome; mobile/library visual checks were interrupted by browser interference, alongside script/CSS and interaction smoke checks.

Try the signed-out toggle, type a draft into a question, explore example feedback and return to the draft. Switch between voice and typing in setup, preview microphone unavailable, then use typing. Open the mock interview, enter responses, inspect previous answers and view the explicitly separate example feedback.
