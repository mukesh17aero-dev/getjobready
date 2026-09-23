// Public surface of the passport feature.
// Everything outside features/passport/ imports from here, never from a file inside.
// Adding a line here is a deliberate decision to widen the feature's contract.

export * from "./passport-overview";
