import type { ResumeCareerProfile, ResumeData } from "./resume-api";
import { splitList } from "./resume-text";
import { DRAFT_LIMITS as L } from "./resume-draft-validation";
import { resumeVoice } from "./resume-voice";

// "Start with a blank resume", started from what the profile already holds.
//
// The person writes this resume themselves, but asking for their details and
// then opening an empty editor made them type everything twice. This copies
// the profile into the resume's sections exactly as it was saved - no model,
// no rewording, nothing added - and leaves the writing to them. Rows come
// first; without rows, the profile page's own fields (see profile-fields.ts).

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const has = (value: unknown) => text(value).length > 1;
const isCurrent = (value: unknown) => value === true || text(value).toLowerCase() === "yes";

// A resume holds less than a profile can: ten skills to a group, five
// bullets of 220 characters to a job, 700 for a summary. A copy that ignored
// those could not be saved at all, and every edit after it silently failed.
// So the copy is fitted - shortened only at a sentence or word end, never
// mid-word - while the profile itself keeps everything.

/** Within max, cut at the last sentence end that fits, else the last whole word. */
export function fit(value: string, max: number): string {
  const t = value.trim();
  if (t.length <= max) return t;
  const head = t.slice(0, max + 1);
  const sentence = Math.max(head.lastIndexOf(". "), head.lastIndexOf("! "), head.lastIndexOf("? "), head.lastIndexOf(".\n"));
  if (sentence >= max * 0.5) return head.slice(0, sentence + 1).trim();
  const space = head.lastIndexOf(" ");
  return (space > 0 ? head.slice(0, space) : t.slice(0, max)).trim();
}

/** One bullet per line or sentence, each within the limit, at most n. */
export function bulletsOf(value: string, n: number = L.bulletsPerJob): string[] {
  return resumeVoice(value).split(/\n+|(?<=[.!?])\s+/).map((line) => fit(line, L.bullet)).filter(Boolean).slice(0, n);
}

const GROUP_NAMES = ["Skills", "More skills", "Other skills", "Additional skills", "Further skills"];

/** Skills in groups of ten, at most five groups. */
export function skillGroups(skills: string[]): Array<{ group: string; items: string[] }> {
  const items = skills.map((skill) => fit(skill, L.skill)).filter(Boolean);
  const groups: Array<{ group: string; items: string[] }> = [];
  for (let i = 0; i < items.length && groups.length < L.skillGroups; i += L.skillsPerGroup) {
    groups.push({ group: GROUP_NAMES[groups.length]!, items: items.slice(i, i + L.skillsPerGroup) });
  }
  return groups;
}

/** "2023 – 2026", "2023 – Present", "2023", or "". */
export function periodOf(row: Record<string, unknown>): string {
  const from = text(row.from);
  const to = isCurrent(row.current) ? "Present" : text(row.to);
  if (from && to) return `${from} – ${to}`;
  return from || to;
}

export function resumeFromProfile(profile: ResumeCareerProfile | null, experienced: boolean): ResumeData {
  const p = profile?.preferences ?? {};

  const educationRows = (profile?.education ?? []).filter((row) => has(row.qualification) || has(row.course) || has(row.institution));
  const education = educationRows.length
    ? educationRows.slice(0, L.education).map((row) => ({ qualification: fit(text(row.qualification) || text(row.course), L.qualification), institution: fit(text(row.institution), L.institution), period: fit(periodOf(row), L.period), detail: fit(text(row.marks), L.educationDetail) }))
    : has(p.institution) || has(p.course)
      ? [{ qualification: fit(text(p.course), L.qualification), institution: fit(text(p.institution), L.institution), period: fit(has(p.expectedFinish) ? `Expected ${text(p.expectedFinish)}` : text(p.yearOfStudy), L.period), detail: fit(text(p.collegePercent), L.educationDetail) }]
      : [];

  // A college project is a project, not a job: it gets its own section.
  const workRows = (profile?.experience ?? []).filter((row) => has(row.title) || has(row.organisation) || has(row.detail));
  const jobs = workRows.filter((row) => text(row.kind) !== "project");
  const projectRows = [...workRows.filter((row) => text(row.kind) === "project"), ...(profile?.projects ?? []).filter((row) => has(row.title) || has(row.detail))];

  const experience = jobs.slice(0, L.jobs).map((row) => ({ title: fit(text(row.title), L.jobTitle), organisation: fit(text(row.organisation), L.organisation), period: fit(periodOf(row), L.period), bullets: bulletsOf(text(row.detail)) }));
  if (experience.length === 0 && projectRows.length === 0) {
    if (has(p.currentRole) || has(p.employer)) experience.push({ title: fit(text(p.currentRole), L.jobTitle), organisation: fit(text(p.employer), L.organisation), period: "", bullets: [] });
    if (has(p.internshipExperience)) experience.push({ title: "Internship", organisation: "", period: "", bullets: bulletsOf(text(p.internshipExperience)) });
  }

  return {
    header: { name: fit(text(p.fullName), L.name), city: fit(text(p.city), L.city), email: fit(text(p.email), L.email), phone: fit(text(p.phone), L.phone), link: fit(text(p.link), L.link) },
    // Left for them to write. The profile's summary is the app's note *to*
    // them ("You're a ...", their pay hopes, advice on what to explore next):
    // nothing that belongs on a page sent to an employer.
    summary: "",
    summaryHeading: experienced ? "Summary" : "Career objective",
    skills: skillGroups(splitList(p.skills)),
    experienceHeading: experienced ? "Work experience" : "Experience",
    experience,
    education,
    projects: projectRows.slice(0, L.projects).map((row) => ({ title: fit(text(row.title), L.projectTitle), detail: fit(resumeVoice(text(row.detail)), L.projectDetail), tools: splitList(row.tools).map((t) => fit(t, L.tool)).slice(0, L.toolsPerProject) })),
    languages: splitList(p.languages).map((l) => fit(l, L.language)).slice(0, L.languages),
    // Activities are sentences, so they split on lines, not on commas.
    activities: text(p.activities).split(/\n+/).map((line) => fit(resumeVoice(line), L.activity)).filter(Boolean).slice(0, L.activities),
    keywordsUsed: [],
  };
}
