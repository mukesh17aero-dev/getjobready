# Ascend user-experience review — 10 September 2026

## Scope and evidence

Review the current product routes and their features, then provide a separate interactive redesign preview. Preserve the approved welcome animation, current teal–emerald gradient, dark/light support, short UI copy, and the 15-minute assessment with mixed response formats. No production redesign is applied in this review.

Evidence types are deliberately distinguished:
- **Browser observed:** navigated the signed-in Chrome tab and read the page's native accessibility tree.
- **Source reviewed:** inspected the actual route/component, including controls and their handlers.
- **Interaction pending:** clicking/filling inside Chrome was blocked: browser scripting is disabled; OS scripting has no assistive access. A request to enable Chrome's “Allow JavaScript from Apple Events” was sent to the user. No end-to-end claims are made for those controls.
- **Unavailable:** the current route is explicitly unreleased; cannot be completed by a user today.

The current browser account is a returning student with an existing selected role and saved assessment/interview/document history. Personal profile text, names, and result identifiers must not be included in the public preview. Preview content is illustrative and local, not written to the account. Paid AI generation, email sending, account deletion, and admin publishing are not exercised.

## Confirmed findings so far

| Page | Evidence | Friction | Proposed direction |
| --- | --- | --- | --- |
| Home | Browser + source | A selected role is visible, but the profile-first hero still says “find a direction.” Journey copy says choose a role after one is chosen. | State the current goal consistently and name the specific missing information; keep tools available. |
| Profile | Browser + source | Long all-at-once form; phone and favourite subjects are presented as prerequisites to exploring. The visible saved story and selected track can disagree. | Short sections, review imported facts, explain optional fields and where each is used. |
| Discovery | Browser + source | Tour planning, compare checkbox, open-card and choose-role actions compete. Cards expose nested interactive controls. | Separate Learn / Compare / Choose actions; begin with the chosen role's workplace and offer optional tour planning. |
| Assessment entry | Browser + source | Returning user sees attempt count and “Take it again,” with no quick reminder of last feedback. | Show last feedback alongside an explicit 15-minute start, and make timer behaviour clear before starting. |
| Assessment result | Browser + source | Long diagnostic report, illustrative employer/six-month benchmarks, and a CTA to unreleased simulations. “Days you worked” actually counts scenes. | Lead with evidence and one improvement; expand full detail on demand; use measured data only and an available next activity. |
| Assessment history | Browser + source | Similar rows use generic “Open”; fixed IST; no role filter control when opened unfiltered. | Group by role, show completion/coverage, descriptive result links, local-time display as a future implementation choice. |
| Resume builder | Browser + source | Entry mixes the account's real name with sample work/education; starts “Build a resume” despite saved documents. | Saved work first for returning users; fully anonymous example behind an explicit preview action. |
| LinkedIn builder | Browser + source | Copy buttons are next to sections, but keep buttons are far below; generic examples mention an unrelated store job. | Review/edit/save/copy together per section; optional AI assistance; clear “Saved in Ascend” versus “Copied for LinkedIn.” |
| Interview setup | Browser + source | Repeated focus-area text; voice/type choice sits below Join; interviewer selection is another pre-start decision. | Voice/type first, one focus, optional advanced settings and a clear 10-minute CTA. |
| Question library | Browser + source | “Answered badly” and “WENT BADLY”; many filters/cards before practice. Source Next question only closes dialog. | “Try again” with concrete coaching; one focused question, optional filters, next-question continuation. |
| Story bank | Browser + source | Globally disabled, but wording implies more student work will unlock it. | State product availability plainly and link to question practice; show future story layout as a labelled concept. |
| Passport | Browser + source | Globally disabled, but wording implies student evidence is the blocker. | Separate availability from evidence; link to existing results. |
| Admin | Browser + source | Content split by document type; selected role context must be found again. Raw document identifiers and pilot access text visible. | Role-centred authoring, preview beside response format, draft/published state and review before publish. |
| Practice hub | Browser + source | Autoplay explanation and illustrative score compete with opening the one live tool; two of three tools unavailable. | Start or resume the live assessment, keep explanations optional and planned tools secondary. |
| College/employer requests | Source | Send request is a mailto, not a submitted request. Employer role placeholder says Placement Officer. | Put the purpose and actual email handoff up front; keep fields and copyable draft if no email client. |
| Settings | Source | Only edit-profile and delete-profile; theme is hidden in avatar menu. | Appearance and account controls up front; retain explicit deletion confirmation separately. |
| Opportunities / missions | Source | Top-level/tool navigation leads to a short “not built” page; missions prose includes multiple scoring concepts. | Clear unreleased state and one available useful alternative. |

See the preview's page-specific review notes for the consolidated proposals and verification limits.

## Preview and validation

Preview: `/previews/ascend-experience-review.html` — 27 selectable review/concept screens including the overview. Product routes remain unchanged, apart from a narrow correction to the previously added welcome account portal: the static HTML prop must retain its identity so React does not replace the portal's DOM target.

- `public-route-observations.json`: 27 public entry URLs, including aliases and login redirects. These are browser-rendered states, not just HTTP status checks.
- `public-interaction-checks.json`: public navigation, form preparation, compare selection, tour entry, setup, account gate and narrow-screen observations. A “passed” entry means the named check ran; read its details for exactly how far it reached. The question-answer preparation entry did not itself submit an answer; deeper checks cover that gate.
- `public-deeper-checks.json`: additional public feature steps and account gates, including tour start and public assessment introduction.
- `preview-checks.json`: 108 render checks (27 concepts × 2 widths × 2 themes), plus local interaction checks for comparison, profile drafts, four response formats, question progression, job-fit demonstration, admin draft navigation and unsent email draft preparation.
- Desktop and mobile preview screenshots inspected. Corrected question-button overflow on small screens and default form-submit behaviour on secondary buttons.
- TypeScript, lint, 41 existing tests and production build passed. Lint retains three pre-existing unused-function warnings in the locked preview files.

## Remaining real-user testing

Chrome's signed-in session could be read and navigated, but not clicked or typed into because browser scripting is disabled. Therefore authenticated saving, upload parsing, AI generation, real microphone/camera recording, downloads of generated documents, assessment deadline/expiry on a real attempt, account switching through Google, and admin draft/publish actions were not completed in this review. No paid AI calls, outgoing emails, deletion or publishing were performed. This is not an end-to-end certification of every feature.

For a complete functional test, enable the requested Chrome scripting control or provide a test account in the isolated browser. Use dedicated test data for generated content and any state-changing authoring workflow. Do not publish or erase the founder's real records as part of a usability review.
