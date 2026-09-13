# Role studio — approved live generation test

Completed 12 September 2026 against the local database. All six current roles passed after correcting generation limits and retrying three rejected drafts. Nothing was published. No learner data was sent.

| Role | Tested skill | Example work scenario |
|---|---|---|
| Customer Success Associate | Customer Case Resolution: Close It Right or Escalate with Everything | Refund Request or Something Else? You Decide. |
| Operations Coordinator | Workflow & Exception Coordination for Operations Coordinators | Write the Escalation — Helix FC Route M-11 Crisis |
| Operations Executive | Stock & Inventory Accuracy for Retail Operations | The Snack Aisle Shortfall |
| Relationship Executive | Customer Needs & Product Suitability | The Business Owner's Surplus |
| Guest Experience Associate | Guest Service Recovery: Owning the Problem, Fixing the Moment | Wrong Dish, Right Now |
| Hub Supervisor | Shift Allocation & Team Briefing | Mid-Shift Reallocation After Two No-Shows |

Each role has one saved module with a lesson, worked example, text illustration cards, a 90-second narrated storyboard, three distinct guided/independent/transfer missions, one baseline question and one fresh reassessment question. All modules pass schema and semantic structure checks; all 18 mission briefs are below 70 words. Review the full draft in `/admin` under Curriculum, Simulations and Assessment.

These checks confirm generation, role differentiation and persistence. They do not establish educational effectiveness, complete coverage of all mapped skills, or validated readiness scores. Additional skill modules and assignment variants still need generation and human review. Video rendering, learner delivery, the personalised plan, reassessment runtime and productivity scoring remain to be implemented. Real email delivery and YouTube search need provider configuration.

Frontend typecheck, lint (five pre-existing warnings), tests and production build passed. Backend typecheck/build and approval/assignment tests passed; three isolated database lifecycle tests cover concurrency, approval invalidation and mocked mail retry.
