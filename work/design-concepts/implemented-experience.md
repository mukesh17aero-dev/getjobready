# Agreed experience implementation — 2026-09-10

User authorized replacing the application screens after approving the separate concepts.

## Application routes

- `/welcome`: approved network welcome transferred without modifying the locked original preview. Native WebGL student station, cohort display and employer work record; original gradient and symbol; cohort CTAs; What is Ascend explanation. Keyboard navigation, reduced motion, WebGL fallback and renderer cleanup.
- `/`: student home reads real journey/profile state. One next action, modern tools, saved profile and role, journey rail. No preview state toggles or invented achievements.
- `/discover`: modern browse cards and hero retain catalogue/compare/selection. Existing role tour contains three workplace camera stops and actual published role information. 3D set is conceptual, not footage of a specific employer.
- `/practice/readiness`: short introduction, one work moment, optional authored support, typed/spoken/artefact and new routing/priority/handover interactions. Shared 15-minute limit, saved drafts, transcript replay, actual answer modality preserved.
- `/admin`: existing assessment editor has response-format authoring, stable option/field IDs and local interactive preview. Existing role details and skill mapping retained.

## Assessment rollout

Backend sibling `ascend-backend` extended deliberately; no scoring or database logic added to frontend. New migration `0031_assessment_formats_deadline.sql` adds explicit begin/deadline, drafts, structured evidence, partial flags and frozen arc content. The deadline is enforced by database time; late request bodies cannot become evidence. Worker sweep finalizes offline attempts; read/resume/answer endpoints also enforce expiry.

Migration applied to the configured LOCAL development PostgreSQL database. Local API started on8080, frontend3000. No hosted deployment, paid generation or content publication performed.

Existing published scenarios keep their original response formats. To convert: Admin → Assessment → choose role → open a scenario's Response format → author choices/items/fields → preview → save draft → publish after content review. The renderer does not invent answer choices from existing questions. A mixed assessment requires a suitably authored pool; do not force all formats into every scene.

Legacy runs cannot reveal whether an unanswered run had begun. Migration conservatively retains the original clock. Historical unpublished question versions cannot be reconstructed; legacy runs pin the available content on first access. New runs freeze content at creation.

Spoken responses are transcribed through the existing backend. Students must stop recording before deadline so transcription can be saved. Recordings are replayable in the current tab; durable evidence is the transcript and its spoken/written modality, not an uploaded audio archive.

## Validation

Frontend typecheck, lint (3 existing locked/earlier preview warnings),41 tests and production build passed. Backend typecheck/build and228 ordinary tests passed. All6 new PostgreSQL assessment integration tests passed using isolated temporary schemas. A wider database-enabled run passed266 tests but exposed2 pre-existing failures: the Discovery lifecycle test still references removed SEED.choices, and the privacy erasure coverage assertion omits8 existing personal-data tables. Those unrelated modules/tests were not changed by this implementation. HTTP checks for application routes and role catalogue. Browser visual and signed-in microphone testing remains a manual verification step.
