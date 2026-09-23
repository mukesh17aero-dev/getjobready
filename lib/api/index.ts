// The typed contract with the Ascend API.
//
// Split one file per backend module so each stays readable; this barrel keeps
// "@/lib/api" as the single import path every caller already uses. Add a new
// module file here rather than growing an existing one past its subject.

export * from "./core";
export * from "./integrity";
export * from "./journey";
export * from "./discovery";
export * from "./story-bank";
export * from "./job-fit";
export * from "./profile";
export * from "./passport";
export * from "./assessment-arc";
export * from "./assessment-run";
export * from "./admin";
export * from "./career-record";
export * from "./employer";
export * from "./commerce";
