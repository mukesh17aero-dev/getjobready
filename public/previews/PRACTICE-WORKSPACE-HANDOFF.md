# Practice workspace preview

Open `/previews/ascend-practice-workspace.html`. The file is standalone and works offline; the header's live-app links require localhost. Other useful anchors: `#new`, `#simulations`, `#activity`, `#report`.

The current Practice route uses `FeatureLanding` to explain Role Readiness Assessment, Simulation Missions and Career Passport. The preview replaces the long introduction/walkthrough with an action suited to the person's actual state, a compact readiness summary and saved work, with simulations visibly in development.

## The four example states

- **First visit:** offer a first role assessment; show "Not assessed yet", with no zero score.
- **After an assessment:** open the role-readiness report, with strengths, gaps and preparation actions tied to the exact assessed run.
- **Assessment in progress:** offer resume and identify the unfinished work in one sentence. Resume the actual run with backend timing and saved responses; navigation does not imply that a timed run is paused.
- **Report being prepared:** show pending review, preserve the run and provide retry/recovery on error. Do not create a second run to obtain feedback or replace an unknown result with zero.

All state-selector choices, assessment values and scenarios are fixed design fixtures. The 65/100 result, five skill scores, four situations and medium confidence are not frontend calculations or new scoring rules. The readiness chart includes only measured skills. Practice must never raise that score automatically.

## Main interactions

Simulations are visibly **In development**, with no launch CTA or interactive simulation. Six illustrative future concepts remain browsable in pages of three and filterable by skill; opening a legacy simulation path shows unavailable status and cannot record an attempt.

The report leads with **overall role readiness**, the assessed role, evidence confidence and coverage. A spider chart and all five exact per-skill scores sit together. Explicit Strengths and Gaps cards surface the two strongest areas and two main development needs; each skill row opens constructive evidence, including the middle-scoring composure skill. These classifications and values are fixtures, not frontend thresholds.

One primary CTA, **Make my next attempt stronger**, opens three preparation actions. **Reassess this role** then leads to the same role's assessment introduction. Preparation never changes readiness; only a newly reviewed run can do so. For real data, validate retake availability and preserve role ID, original report ID and compatible assessment versions. Show an appropriate unavailable state if reassessment cannot start.

The new-user and resume handoffs demonstrate an assessment situation without starting a real session. Career Passport opens an explanation and never claims an issued credential.

Desktop uses a large action card beside the readiness summary, with three compact future-simulation cards below, each marked In development. At 360px the action stays first, decorative art is removed and the readiness summary contracts; detailed bars remain available in the report dialog. Tabs keep the library and activity from lengthening the overview. Touch controls have visible focus and minimum 44px height.

## Production dependencies and availability

Read the current published admin catalogue, skill-to-role mappings and actual assessment/simulation coverage. Use canonical skill IDs and versioned evidence, never free-text generated skills or a score from another role. The preview uses `planning`, `communication`, `problem_solving`, `customer_care` and `composure` from the repository skill catalogue, not a verified live admin snapshot.

`lib/features.ts` currently marks role readiness **live** and Simulation Missions / Career Passport **building**. `/practice/missions` is still a ComingSoon page. Simulations must remain informational and visibly In development, with no start or preview-simulation CTA. Keep Passport visibly in development.

The landing page currently fetches only journey state. Actual recommendations, recent/open runs, review status and mission availability need a backend-owned response or approved typed calls assembled in the routing layer. Use the latest applicable reviewed run for the selected role, explicit nulls for missing scores and actual run/mission IDs in every link. On load failures, show retry instead of an empty or invented personal record.

When role selection is implemented, update requirements, assessment availability, recommendations and history together. The HTML deliberately carries one role fixture; its role control explains the intended picker rather than reusing the same scores under another title. Student and signed-out entry points should preserve intended role/action through authentication when the user starts work.

No production routes or components were modified for this preview. Backend calls, scoring, payment/access checks and actual autosave are outside the static HTML.
