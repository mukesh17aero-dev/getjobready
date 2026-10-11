import { z } from "zod";
import type { ResumeData } from "./resume-api";

// Transport limits of /v1/resume/draft. Validate before sending handwritten
// content: the generation endpoint's clipping must not silently shorten edits.
/** The draft's size limits, in one place: the validation below and anything that fills a draft both read these. */
export const DRAFT_LIMITS = {
  name: 80, city: 80, email: 120, phone: 40, link: 160,
  summary: 700, heading: 40,
  skillGroups: 5, skillsPerGroup: 10, skill: 60, skillGroup: 40,
  jobs: 6, jobTitle: 80, organisation: 90, period: 40, bulletsPerJob: 5, bullet: 220,
  education: 4, qualification: 90, institution: 90, educationDetail: 120,
  projects: 5, projectTitle: 90, projectDetail: 240, toolsPerProject: 6, tool: 40,
  certifications: 8, achievements: 6, achievement: 180,
  languages: 8, language: 30, activities: 6, activity: 160, interests: 8, interest: 60,
} as const;
const L = DRAFT_LIMITS;
const text = (max: number) => z.string().max(max);
const list = (length: number, count: number) => z.array(text(length)).max(count);
const draft = z.object({
  header: z.object({name:z.string().min(1).max(L.name),city:text(L.city),email:text(L.email),phone:text(L.phone).optional(),link:text(L.link).optional()}),
  summary: text(L.summary), summaryHeading: text(L.heading).optional(), experienceHeading: text(L.heading),
  skills: z.array(z.object({group:text(L.skillGroup),items:list(L.skill,L.skillsPerGroup)})).max(L.skillGroups),
  experience:z.array(z.object({title:text(L.jobTitle),organisation:text(L.organisation),period:text(L.period),bullets:list(L.bullet,L.bulletsPerJob)})).max(L.jobs),
  education:z.array(z.object({qualification:text(L.qualification),institution:text(L.institution),period:text(L.period),detail:text(L.educationDetail)})).max(L.education),
  projects:z.array(z.object({title:text(L.projectTitle),detail:text(L.projectDetail),tools:list(L.tool,L.toolsPerProject)})).max(L.projects).optional(),
  certifications:z.array(z.object({title:text(120),issuer:text(90),year:text(20)})).max(L.certifications).optional(),
  achievements:list(L.achievement,L.achievements).optional(),languages:list(L.language,L.languages),activities:list(L.activity,L.activities),interests:list(L.interest,L.interests).optional(),
});
export function resumeDraftIssue(resume: ResumeData): string | null {
  const parsed = draft.safeParse(resume); if (parsed.success) return null;
  const issue = parsed.error.issues[0];
  if (issue.path.join(".") === "header.name" && !resume.header.name.trim()) return "Add your full name to save this draft.";
  // The most common one, said the way a person would: a skills group is full.
  if (issue.code === "too_big" && issue.path[0] === "skills" && issue.path[2] === "items") {
    return `Skills group ${Number(issue.path[1]) + 1} has more than ${issue.maximum} skills. Move some into another group or remove a few - your changes are not saved until then.`;
  }
  const field = issue.path.map(part => typeof part === "number" ? `entry ${part + 1}` : String(part).replace(/([A-Z])/g, " $1").toLowerCase()).join(" · ");
  if (issue.code === "too_big") return `${field}: use at most ${issue.maximum} ${issue.origin === "array" ? "entries" : "characters"}. Your changes have not been saved yet.`;
  return `${field}: add the missing information to save your changes.`;
}
