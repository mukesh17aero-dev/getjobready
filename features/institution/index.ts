// Public surface of the institution feature.
// Everything outside features/institution/ imports from here, never from a file inside.
// Adding a line here is a deliberate decision to widen the feature's contract.

export { CohortDashboard } from "./cohort-dashboard";
export { CollegeInvitations, CollegeLinksSettings } from "./college-links";
