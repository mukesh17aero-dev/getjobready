// Public surface of the simulation feature.
// Everything outside features/simulation/ imports from here, never from a file inside.
// Adding a line here is a deliberate decision to widen the feature's contract.

export * from "./simulation-api";

export { WorkplaceOrientation } from "./workplace-orientation";

export { SimulationLearning } from './journey-workspace';
export { JourneyActivityPlayer, type ActivityDraft } from './journey-activity';
export { PracticeLanding } from "./practice-landing";
