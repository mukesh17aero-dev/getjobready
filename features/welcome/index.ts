// Public surface of the welcome feature.
// Everything outside features/welcome/ imports from here, never from a file inside.
// Adding a line here is a deliberate decision to widen the feature's contract.

export * from "./audience-hero";
export * from "./catalogue/index-map";
export * from "./catalogue/journey";
export * from "./catalogue/partners";
export * from "./catalogue/types";
export * from "./feature-grid";
export * from "./feature-landing";
export * from "./network-welcome";
export * from "./request-access";
export { welcomeSlides } from "./welcome-slides.js";
