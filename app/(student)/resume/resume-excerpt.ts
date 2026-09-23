// A display copy of the latest saved resume, read without changing it.
import type { ResumeData } from "@/features/resume";
export type ResumeSnapshot = {
  role: string; at: string; name: string; summaryHeading: string; summary: string;
  skills: { group: string; items: string[] }[];
  experienceHeading: string;
  experience: { title: string; organisation: string; period: string; bullets: string[] }[];
  education: { qualification: string; institution: string; period: string; detail: string }[];
  projects: { title: string; detail: string; tools: string[] }[];
  certifications: { title: string; issuer: string; year: string }[];
  achievements: string[]; languages: string[]; activities: string[]; interests: string[];
  downloaded: boolean;
};
const object = (v: unknown): Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v) ? v as Record<string, unknown> : {};
const string = (v: unknown) => typeof v === "string" ? v : "";
const strings = (v: unknown) => Array.isArray(v) ? v.filter((item): item is string => typeof item === "string") : [];
const objects = (v: unknown) => Array.isArray(v) ? v.map(object) : [];

export function resumeSnapshot(raw: unknown): ResumeSnapshot | null {
  if (!Array.isArray(raw)) return null;
  const latest = raw.map(object).filter(e => typeof e.role === "string" && typeof e.at === "string" && Object.keys(object(e.resume)).length > 0)
    .sort((a, b) => string(b.at).localeCompare(string(a.at)))[0];
  if (!latest) return null;
  const resume = object(latest.resume);
  return {
    role: string(latest.role), at: string(latest.at), name: string(object(resume.header).name),
    summaryHeading: string(resume.summaryHeading) || "Profile", summary: string(resume.summary),
    skills: objects(resume.skills).map(group => ({ group: string(group.group), items: strings(group.items) })).filter(group => group.items.length > 0),
    experienceHeading: string(resume.experienceHeading) || "Experience",
    experience: objects(resume.experience).map(entry => ({ title: string(entry.title), organisation: string(entry.organisation), period: string(entry.period), bullets: strings(entry.bullets) })),
    education: objects(resume.education).map(entry => ({ qualification: string(entry.qualification), institution: string(entry.institution), period: string(entry.period), detail: string(entry.detail) })),
    projects: objects(resume.projects).map(entry => ({ title: string(entry.title), detail: string(entry.detail), tools: strings(entry.tools) })),
    certifications: objects(resume.certifications).map(entry => ({ title: string(entry.title), issuer: string(entry.issuer), year: string(entry.year) })),
    achievements: strings(resume.achievements), languages: strings(resume.languages), activities: strings(resume.activities), interests: strings(resume.interests),
    downloaded: Boolean(latest.downloadedAt),
  };
}

/** The same display shape from a resume document already in hand - the worked example a visitor sees. */
export function snapshotFromResume(resume: ResumeData, role: string): ResumeSnapshot {
  return {
    role, at: "", name: resume.header.name, summaryHeading: resume.summaryHeading || "Profile", summary: resume.summary,
    skills: resume.skills.filter(group => group.items.length > 0), experienceHeading: resume.experienceHeading || "Experience",
    experience: resume.experience, education: resume.education, projects: resume.projects ?? [], certifications: resume.certifications ?? [],
    achievements: resume.achievements ?? [], languages: resume.languages, activities: resume.activities, interests: resume.interests ?? [], downloaded: false,
  };
}
