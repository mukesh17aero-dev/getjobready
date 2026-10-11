// Public surface of the discovery feature.
// Everything outside features/discovery/ imports from here, never from a file inside.
// Adding a line here is a deliberate decision to widen the feature's contract.

export * from "./assistant-answers";
export * from "./assistant-knowledge";
export * from "./assistant-tour";
export * from "./discovery-browse";
export * from "./industry-brief";
export * from "./pay-progression";
export * from "./role-brief";
export * from "./role-art";
export * from "./role-compare";
export * from "./role-page";
export * from "./role-preview";
export * from "./role-tour";
export * from "./role-tour-stage";
export * from "./samples";
export * from "./work-rail";

export {TourReflection} from "./tour-reflection";
export {useTourMemory} from './use-tour-memory';

export { exploreIntro, type ExploreIntro } from "./explore-intro";

export { RoleAlignment } from "./role-alignment";

export { InterestSelection } from "./interest-selection";
