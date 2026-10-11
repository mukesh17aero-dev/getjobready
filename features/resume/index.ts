// Public surface of the resume feature.
// Everything outside features/resume/ imports from here, never from a file inside.
// Adding a line here is a deliberate decision to widen the feature's contract.

export * from "./essentials-modal";
export * from "./plans";
export * from "./resume-api";
export * from "./resume-pagination";
export * from "./resume-setup";
export * from "./resume-sheet";
export * from "./resume-template-access";
export * from "./resume-text";
export * from "./resume-vocab";
export * from "./review-progress";
export * from "./samples";
export * from "./starter-resumes";
export * from "./templates";

export { ResumeStudio } from "./resume-studio";

export { GuestResume } from "./guest-resume";

export { SavedResumes, ResumeLoadError } from "./saved-resumes";
