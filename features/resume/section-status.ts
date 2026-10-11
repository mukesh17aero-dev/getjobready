import { resumeCompleteness, type ResumeData } from "./resume-api";
import { requiredDestination } from "./resume-required";
import type { ResumeSection } from "./resume-section-editor";

// What each section of the editor's section buttons says about itself:
// still needed before download, has something in it, or optional and empty.
// "Needed" comes from the same completeness rules the download uses, through
// the same mapping the "Before you download, add" buttons use - never a
// second set of rules.

export type SectionStatus = "needed" | "done" | "empty";

const said = (value: unknown) => typeof value === "string" && value.trim().length > 0;

function hasContent(resume: ResumeData, section: ResumeSection): boolean {
  switch (section) {
    case "header": return said(resume.header.name);
    case "summary": return said(resume.summary);
    case "experience": return resume.experience.length > 0;
    case "education": return resume.education.length > 0;
    case "skills": return resume.skills.some((group) => group.items.length > 0);
    case "projects": return (resume.projects ?? []).length > 0;
    case "certifications": return (resume.certifications ?? []).length > 0;
    case "achievements": return (resume.achievements ?? []).length > 0;
    case "languages": return resume.languages.length > 0;
    case "activities": return resume.activities.length > 0;
    case "interests": return (resume.interests ?? []).length > 0;
  }
}

export function sectionStatuses(resume: ResumeData): Record<ResumeSection, SectionStatus> {
  const needed = new Set(resumeCompleteness(resume).missing.map((gap) => requiredDestination(gap).section));
  const status = (id: ResumeSection): SectionStatus => (needed.has(id) ? "needed" : hasContent(resume, id) ? "done" : "empty");
  return {
    header: status("header"), summary: status("summary"), experience: status("experience"), education: status("education"),
    skills: status("skills"), projects: status("projects"), certifications: status("certifications"), achievements: status("achievements"),
    languages: status("languages"), activities: status("activities"), interests: status("interests"),
  };
}
