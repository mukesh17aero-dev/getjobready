// Where the person is - studying or starting out, or already working - decides
// what a strong resume looks like for them: the order of the sections, which
// ones it needs, how long it runs. One definition, read by the editor's
// section list and sent to every writer and reader in the backend, which
// keeps the same standard in src/modules/resume/track.ts.

export type ResumeTrack = "student" | "early_career";
export type SectionKey = "header" | "summary" | "experience" | "education" | "skills" | "projects" | "certifications" | "achievements" | "languages" | "activities" | "interests";

/** required: the resume is not that level's resume without it. recommended: what makes it stand out. more: folded away until wanted. */
export type SectionNeed = "required" | "recommended" | "optional" | "more";

export const TRACK_STANDARD: Record<ResumeTrack, { pages: 1 | 2; order: SectionKey[]; need: Record<SectionKey, SectionNeed> }> = {
  // Education and projects are the evidence a first-job recruiter looks for first.
  student: {
    pages: 1,
    order: ["header", "summary", "education", "projects", "experience", "skills", "certifications", "achievements", "activities", "languages", "interests"],
    need: { header: "required", summary: "required", education: "required", projects: "recommended", experience: "recommended", skills: "required", certifications: "optional", achievements: "recommended", activities: "recommended", languages: "optional", interests: "more" },
  },
  // Work leads: three to five lines a role, with what came of it.
  early_career: {
    pages: 2,
    order: ["header", "summary", "experience", "achievements", "skills", "education", "certifications", "projects", "languages", "activities", "interests"],
    need: { header: "required", summary: "required", experience: "required", achievements: "recommended", skills: "required", education: "required", certifications: "optional", projects: "optional", languages: "optional", activities: "more", interests: "more" },
  },
};

export const standardFor = (track?: ResumeTrack) => TRACK_STANDARD[track ?? "student"];
