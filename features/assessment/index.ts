// Public surface of the assessment feature.
// Everything outside features/assessment/ imports from here, never from a file inside.
// Adding a line here is a deliberate decision to widen the feature's contract.

export * from "./assessment-copy";
export * from "./assessment-glossary";
export * from "./assessment-interaction";
export * from "./assessment-presentation";
export * from "./assessment-question";
export * from "./assessment-readout";
export * from "./assessment-run";
export * from "./assessment-wording-import";
export * from "./integrity-signals";
export * from "./samples";
export * from "./screen-guard";
