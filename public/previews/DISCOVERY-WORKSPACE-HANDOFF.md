# Discovery workspace · clean module preview

Open `/previews/ascend-discovery-workspace.html`. Assets are `ascend-discovery-workspace.css`, `ascend-discovery-workspace.js` and `ascend-discovery-workspace-data.js` in the same folder. No new dependencies, live account writes, AI requests or scoring. Preserve existing live work by Claude and the founder; this preview is isolated.

## What changed and why

The live catalogue has a large banner that pushes roles below the first screen. The role page then stacks work mix, responsibilities, skills, pay, conditions, hard truths and stories into one long page. The preview opens directly on a compact discovery workspace, keeps three cards per desktop page and two per mobile page, and groups role detail into The work, Reality check and Skills & growth. Text has explicit light/dark tokens. Decorative card art disappears on small screens.

There are six role examples across five industries, taken from the repository seeds; this is not a verified snapshot of the current admin publication. Canonical skill IDs and role associations also come from the seed, with no weights or scoring formulas copied. Pay and work-mix values are clearly labelled pilot examples. Do not present salary examples as verified offers or publish invented employee testimonials.

## Entire journey

- Browse: optional industry interests, industry filter, search, pagination and empty states. Interests reorder the catalogue, not create a personalised recommendation. No initial modal blocks people who do not yet know their interests.
- Shortlist: heart a role, revisit it later or remove it. Keep this separate from choosing a direction. Compare exactly two roles with the same criteria and no automatic winner.
- Role: a specific role has a shareable route; work, realities and skills/growth use compact tabs. An invalid role stays unavailable instead of silently opening a default. Optional reflection and Curiosity / Not sure / Not for me responses remain attached to that role.
- Assistant: open on demand, retain role context and allow preset questions or free text. Preset responses in the HTML are excerpts from role content. Custom questions are kept but honestly unanswerable without the real service. Production needs authentication, request/error state and source-grounded answers from the existing backend.
- Tour: edit three or five stops, reorder/remove/add, then explore four short chapters per role. Pause without losing position. Resuming preserves the exact stop, chapter and notes. A new tour asks before replacing an incomplete itinerary and keeps role notes. Reflection is optional. All itinerary roles remain visible in the tour summary, including those with no notes.
- Direction: explicitly choose or change the role. Existing work remains with its original role. The guest example preserves the intended choice through an illustrative sign-in handoff. No actual account is created.
- Readiness: preserve the chosen canonical role ID, show Not assessed until reviewed evidence exists, verify published assessment coverage and display a useful unavailable state where necessary. Simulations remain In development with no launch CTA.

Preview routes: `#explore`, `#saved`, `#my-tour`, `#plan`, `#tour`, `#summary`, `#role/customer_success_associate/work` (also `reality` and `growth`), `#direction`. The native browser Back button navigates the journey. Drafts/notes use a preview-only sessionStorage namespace; production account persistence belongs to the backend.

## Early recommendations: founder's updated requirement

Start offering recommendations after a few meaningful interactions. Aim for an initial useful shortlist within roughly 2–4 explicit interactions when the evidence supports it; do not promise high confidence after a fixed number of clicks.

Use the interactions already in Discovery: the kind of work the user is drawn to, their response to a concrete task, the trade-offs they accept, role reactions, comparison decisions and optional reflections. Industry selection or time spent browsing is weak evidence on its own. Do not double-count repeated clicks or treat a saved role as proof of competence.

Show provisional suggestions early, with one useful question to distinguish the leading possibilities. Promote to strong confidence only when the backend has sufficiently consistent, discriminating evidence and calibrated uncertainty. A conflicting answer, Not for me reaction or correction should revisit the recommendation. Keep meaningful alternatives available; never manufacture certainty to satisfy an interaction-count target.

The UI should receive canonical role IDs, provisional/confident/insufficient-evidence status, reasons tied to actual interactions, uncertainty, and the next useful prompt from the backend. Include result/version and evidence provenance so stale recommendations can be identified. Confidence thresholds and evidence aggregation stay entirely in `ascend-backend`; validate confidence against outcomes before calling it calibrated. A frontend cannot establish confidence by formatting a number.

The live role inspected during review showed `Strong fit · 0% match with your choices`. Do not display that contradictory combination. Missing or invalid data must not become zero; only show a match/confidence claim when its status and supporting evidence are valid. Recommendation confidence expresses interest/direction fit, never role readiness or hiring probability.

### How the preview demonstrates this

Click Help me find a direction. Three scripted branches cover people-focused work, operations and relationship work. Each branch asks a work preference and two follow-ups before displaying a fixed strong-confidence example, with three visible reasons. The role names are real catalogue IDs, but the confidence and explanation are **scripted engine-response fixtures**. There is no recommendation algorithm or score in this frontend.

Selecting Not sure displays More evidence needed and keeps exploration open. Correct my preferences dismisses the previous recommendation and reopens the choices. The confident card replaces the initial guidance card so the page does not grow with redundant calls to action. The production service can recommend sooner, later, or remain uncertain based on actual evidence; never port the scripted three-interaction sequence as a confidence rule.

## Integration and verification

Current entry files: `app/(student)/discover/page.tsx`, `discover-entry.tsx`, `discovery-flow.tsx`; presentational pieces include RoleList, ItineraryPicker, RolePage, RoleCompare, RoleTourStage and AssistantBubble. Reuse server-owned catalogue, published availability, role selection and draft contracts. Recommendation updates need typed backend support, not local arithmetic. Keep real role query parameters through every stage and authenticate only at the appropriate existing save/assistant boundary.

Verify at 360px, 390px and desktop, in both themes. Try role search/filter with no results; shortlist two roles and compare; add a role note and revisit; complete a tour; pause/resume mid-chapter; choose another role and confirm the specific change; switch to Guest or No assessment available. Catalogue unavailable is a separate example with retry that does not erase notes.

Verification in this session: all standalone JavaScript/CSS parsed; interaction checks exercised desktop/mobile pagination, detail tabs, isolated role notes, shortlist, full tour, exact-role readiness handoff, guest state, changing a direction, confidence/uncertainty examples, theme and error recovery. Repository checks and visual inspection are recorded in the delivery message.
