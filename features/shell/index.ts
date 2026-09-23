// Public surface of the shell feature.
// Everything outside features/shell/ imports from here, never from a file inside.
// Adding a line here is a deliberate decision to widen the feature's contract.

export * from "./ambience";
export * from "./app-header";
export * from "./footprint-tracker";
