import type { ResumeGap } from "./resume-api";
import type { ResumeSection } from "./resume-section-editor";

// Navigation labels for the existing export requirements, not a second
// completeness calculation. The API remains the authority on export rules.
export const requiredDestination = (gap: ResumeGap): { section: ResumeSection; label: string } => {
  switch (gap.section) {
    case "Your name": return { section: "header", label: "Full name" };
    case "A way to reach you": return { section: "header", label: "Email" };
    case "Your profile": return { section: "summary", label: "Summary" };
    case "Skills": return { section: "skills", label: "At least 3 skills" };
    case "What you have done": return { section: "experience", label: "One experience or project" };
    case "Education": return { section: "education", label: "One qualification" };
    default: return { section: "header", label: gap.section };
  }
};
