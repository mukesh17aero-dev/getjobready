// Public surface of the admin feature.
// Everything outside features/admin/ imports from here, never from a file inside.
// Adding a line here is a deliberate decision to widen the feature's contract.

export * from "./admin-studio-api";
export * from "./admin-view-as";
