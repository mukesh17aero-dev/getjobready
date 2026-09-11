# Resume and professional profile previews

Open `/preview-resume-studio` and `/preview-professional-studio`. Both have a Desktop/Mobile switch and clickable stage navigation. These are separate design previews; no existing welcome, home, profile, application workspace or builder implementation was changed for this work.

Direct visual feedback examples: `/preview-resume-studio?step=review&example=targeted` and `/preview-resume-studio?step=review&example=general`. Pricing proposal: `/preview-resume-plans` (see its `PRICING-PROPOSAL.md`).

## Visual feedback update

The founder requested fewer paragraphs, more useful graphics, role suggestions for untargeted resumes and direct readiness/simulation actions. Review now leads with a categorical resume-standing indicator, a keyword-coverage ring showing actual covered/total counts, and a separate assessment-readiness card. It shows up to three strengths and two priority improvements; complete wording remains in an expandable evidence section.

For general resumes, show up to three `review.roleIdeas`, a short reason, and readiness per exact matching role from `listAssessableRoles`. Show a score only when a valid saved `lastReadiness` exists for that exact role. Otherwise show “Not assessed.” Example reviews never borrow the signed-in user's score. The `role` query parameter on readiness links uses the existing assessment role ID; a role without an available assessment routes to discovery instead of quietly assessing another role.

The coverage ring measures words present in the document, not demonstrated skill, ATS pass probability or role readiness. Do not derive new scoring logic from it. The production backend should return concise strength/gap headlines with evidence references; the preview only abbreviates existing feedback for display and keeps full text accessible. Keep new analysis and recommendation logic on the backend.

## What is real in the previews

- Signed-in pages read existing backend records with the server session. The resume preview validates ledger entries and selects the latest dated record containing a complete resume shape. The profile preview reads the existing professional profile.
- Missing records use explicitly labelled examples. An API failure is distinguished from an absent saved record.
- Resume layout changes, summary edits, suggestion accept/dismiss and undo work locally. The example Scribe response is explicitly a deterministic shortening, not an AI response. The optional answers and setup selections do not regenerate the displayed saved resume.
- Profile section selection, headline choices, direct edits, comparison, per-section Keep and clipboard copying work locally. Kept values remain distinct from newer drafts. Copy never publishes. Photo selection uses a local file reader with image type/size checks; it does not upload.
- Export is a labelled simulation. No PDF/Word file is created and no downloaded timestamp is written by the preview.
- All preview state resets on reload. No backend writes, local-storage persistence or new dependencies were introduced.

## Live walkthrough findings

On 11 September 2026 the signed-in resume builder was used to generate a Customer Success Associate resume. It asked eight optional questions about responsibilities, customer issues, prioritisation, communication, ownership, dashboards, outage outcomes and team planning. Those questions were left unanswered; no additional career facts were invented. The generated resume was then visible in the real saved ledger.

The desktop draft already has Scribe beside the document. The important change is the sequence and clearer handoff, rather than adding a side panel that already exists. Source inspection confirms the current builder opens review after Word export or the browser print callback. The final download/review handoff was not completed through the browser during this walkthrough. Do not treat a print-dialog close as proof a PDF was saved.

The professional profile page was inspected with its saved draft. Five sections were unkept. Photo controls, alternative headlines and the Keep controls appeared after the long profile preview. Generic prompts included a store job unrelated to this profile. Keep section-specific prompts grounded in the user's record. The existing resume and professional-profile sources also show different job-title histories; do not silently reconcile them or present the draft as verified employment history.

## Resume implementation direction

1. **Start:** three visible purposes, saved-record context, career stage and layout. Keep the job posting optional and collapsed. A new user should get the existing essentials fields only when missing; do not require repeat entry of saved facts.
2. **Details:** show the backend's actual gap questions, one at a time, with group navigation and a clear **Use saved details** action. All questions remain optional. Preserve the current new-skill/claim acknowledgement requirements before saving any new facts.
3. **Draft:** show the document and focused Scribe editor together. On mobile, use Document/Edit controls; do not shrink the whole desktop workspace into a phone. Keep an undo path and show revision refusals, additions and follow-up questions distinctly.
4. **Review:** move feedback before export. Use `reviewResume` for the exact current draft, show actual strengths, gaps and coverage, and invalidate feedback after an edit. Do not substitute an old review for a newer draft. The preview offers an explicitly labelled example when no current review exists.
5. **Export:** show Word and PDF as explicit choices. Use `resumeCompleteness` and actual `ats` output for readiness/file-readability statements. Use the existing Word endpoint, and only mark a successful file handoff after success. Treat browser printing as a request to print, not proof of a saved file.
6. **Return:** preserve resume, template, review and timestamps together in the existing ledger. Reopen by record timestamp. Build the next-step card from that version's actual review; explain the recommendation in one sentence.

Existing integration points: `getResumeRecord`, `getResumeTarget`, `resumeGapCheck`, `generateResume`, `readResumeUpload`, `refineResume`, `reviewResume`, `downloadResumeDocx`, `saveResumeProfile` in `lib/resume-api.ts`. Keep API orchestration in the feature layer and business logic in the backend. Preview layout variants are visual approximations, not the production export renderer.

## Professional profile implementation direction

1. **Start:** preserve the three existing sources: Ascend record, LinkedIn PDF, existing resume. Returning users open their working draft directly.
2. **Shape:** five compact section controls: Headline, About, Experience, Skills, Open to work. Review one section at a time. Put alternate headlines inside Headline, and use compact expandable rows for experience.
3. Keep **Current/kept** and **Working draft** distinct. Comparison is optional. Place the Keep action next to its section. Never accept all sections automatically after generation or revision.
4. Make Scribe's context explicit. A revision can still affect multiple sections; display the actual backend `changed`, `added`, `declined` and `followUp` fields and retain the existing conversation-history handling.
5. Keep the photo action beside the portrait, including on mobile. Use the existing `PhotoPicker` cropping and upload pipeline in production. The local preview upload does not replace that pipeline.
6. **Copy:** give users a compact checklist of kept sections. Copy the kept version, not an unaccepted newer draft. Retain per-role bullet copying and individual-skill handling. Clearly state that keeping/copying does not publish to LinkedIn.

Existing integration points: `getProfessionalProfile`, `writeProfessionalProfile`, `reviseProfessionalProfile`, `acceptProfileSection`, `importLinkedInPdf`, `uploadProfilePhoto`, `agreeProfileIdentity` in `lib/api.ts`. Keep accepted/suggested semantics unchanged.

## Quick review

- Resume: Start → Details → skip or answer → Your draft → change layout → preview a shorter summary → keep/undo → Review → Export → preview completion. Open Saved versions to inspect an older record. Use the full-feedback example when the selected record has no saved review.
- Profile: choose headline → Keep headline → About → compare/edit → keep → Experience/Skills/Open to → Copy to LinkedIn → expand a kept section and copy. Open profile preview to try a local photo. The source and error states are accessible from the stage/demo controls.
- Repeat with the Mobile toggle. Long documents still scroll naturally; stage navigation, focused sections and the visible continuation action reduce unnecessary scrolling.

Framework checks use the installed Next.js 16.2.12 documentation. Older project notes describing Next 14 should not be used to change the installed version. No framework migration is part of these previews.
