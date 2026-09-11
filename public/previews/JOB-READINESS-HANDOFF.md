# JD → skills → role readiness → preparation

Preview: `/previews/ascend-job-readiness.html` (direct report: `#report`). Standalone, inline HTML/CSS/JS; no account mutations or AI calls. Do not replace existing pages until this design is chosen.

## The intended behaviour

1. Extract requirements from the exact pasted JD and retain source passages. Resolve requirements to **existing canonical skill IDs in the current admin-published skill model**. Do not create skills from free text. Separate explicit requirements, uncertain mappings, unsupported requirements and non-skill eligibility criteria.
2. Use admin skill-to-role mappings to suggest a relevant role. Validate that its **published assessment actually measures the matched skills**. A role association alone does not establish assessment coverage. Keep uncovered requirements visible. No readiness score from a JD or resume alone.
3. Preserve the JD/check ID and catalogue, mapping and assessment versions through the assessment handoff. Route to the exact role and return to the exact check/run, not the user's unrelated default role or latest report.
4. Populate the final report from actual assessment evidence: per-skill scores, response evidence, confidence, attempt coverage and a role-readiness result scoped to the assessed role. Show JD coverage separately. Never turn an unassessed skill into zero or count unsupported requirements as evidence of inability.
5. **The primary feedback CTA is Prepare for reassessment.** Open concise actions tied to planning, problem solving and composure, then offer reassessment of the same role. Preserve the role, check and report IDs. Simulations are **In development** and have no active CTA. Preparation does not increase readiness; a newly reviewed assessment supplies new evidence. Validate actual retake availability before starting a run.

## Visual report

Spider chart only over measured JD-relevant skills, accompanied by exact-value bars. With fewer than three measured skills, show bars without a polygon. List unknowns explicitly. No invented employer benchmark, hiring probability or unsupported improvement trend. Do not silently change chart axes between compared runs.

Keep the overview compact. Show explicit strengths and gaps beside the overall role-readiness score and per-skill scores. Separate Skills & evidence and Next steps into tabs. Evidence is available on each bar. Constructive feedback follows observed decision → consequence → a specific next action. The preview's 65/100, five assessed skills, four situations and confidence are **fixed illustrative fixtures**, not a scoring formula or thresholds to implement.

## Catalogue and current implementation limits

The preview uses the seven actual IDs/names in `ascend-backend/seeds/skill_model.json`; it does **not** claim to mirror the current admin publication. Live admin changes could not be verified during the browser walkthrough. `skillRole` is keyed skill ID → role ID → level; don't transpose it. In that seed, Follow-through is not linked to Customer Success Associate, so the preview leaves it uncovered. Salesforce proficiency has no matching ID in that seed.

The existing `JobFitCheck` contract in `lib/api.ts` has free-text requirements, aggregate axes/readiness and a nextAction enum for questions, stories, interviews and profile edits. It lacks canonical JD skill mappings, assessment provenance and simulation destinations. This needs a **backend contract change**, not a frontend replacement of the score.

The readiness page currently accepts `role` and `begin` query parameters, and the role picker starts `/practice/readiness?role=<id>&begin=1`. Its start-screen selection currently defaults to the first role; forwarding `?role=` without preserving it through that screen can change the assessment. Validate and retain the chosen ID server-side. A report requires the exact returned run ID.

Simulation Missions is currently described as in development in the live Practice UI. The preview marks simulations In development; legacy practice anchors show unavailable status. The assessment example is a readiness handoff, not a simulation mission. Authentication, draft persistence, safe retry/resume and assessment availability must use backend-owned state.

## Useful preview checks

Map the example JD; inspect a skill row and the unmapped Salesforce requirement; open the readiness path; switch to "No published assessment"; view the example report; inspect the Planning bar; follow "Prepare for reassessment" and "Reassess this role". Pasting a different JD shows an honest static-preview handoff and does not pretend that fixed sample results came from it.
