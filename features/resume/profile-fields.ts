import type { ResumeCareerProfile } from "./resume-api";

// What the resume builder can read from someone's profile.
//
// The profile page keeps where someone studies and what they do as single
// fields - institution and course; current role and employer; an internship;
// activities - not as rows. The builder only looked at rows, so a person whose
// profile said all of it saw an empty preview and was asked to type it in a
// second time, and the backend refused to build. These read rows first and
// fall back to the profile page's fields; nothing is written back.
//
// Mirrors hasEducation() / hasExperience() in the backend resume module.

export type ShownRow = { title: string; place: string; detail: string };

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const has = (value: unknown) => text(value).length > 1;

/** Where they studied: education rows, else the profile page's institution and course. */
export function profileEducation(profile: ResumeCareerProfile | null): ShownRow[] {
  const rows = (profile?.education ?? [])
    .filter((row) => has(row.qualification) || has(row.course) || has(row.institution))
    .map((row) => ({ title: text(row.qualification) || text(row.course), place: text(row.institution), detail: "" }));
  if (rows.length) return rows;
  const p = profile?.preferences ?? {};
  if (!has(p.institution) && !has(p.course)) return [];
  const when = has(p.expectedFinish) ? `Expected ${text(p.expectedFinish)}` : text(p.yearOfStudy);
  return [{ title: text(p.course), place: text(p.institution), detail: when }];
}

/** What they have done: experience and project rows, else the profile page's work fields. */
export function profileExperience(profile: ResumeCareerProfile | null): ShownRow[] {
  const rows = [
    ...(profile?.experience ?? []).filter((row) => has(row.title) || has(row.organisation) || has(row.detail)),
    ...(profile?.projects ?? []).filter((row) => has(row.title) || has(row.detail)),
  ].map((row) => ({ title: text(row.title), place: text(row.organisation), detail: text(row.detail) }));
  if (rows.length) return rows;
  const p = profile?.preferences ?? {};
  const shown: ShownRow[] = [];
  if (has(p.currentRole) || has(p.employer)) shown.push({ title: text(p.currentRole), place: text(p.employer), detail: "" });
  if (has(p.internshipExperience)) shown.push({ title: "Internship", place: "", detail: text(p.internshipExperience) });
  if (has(p.activities)) shown.push({ title: "Activities", place: "", detail: text(p.activities) });
  return shown;
}

/**
 * Done means done the way the form means it: the step's required fields have
 * something in them. Somewhere studied needs the course and the college;
 * something done needs what it was and what they did. A role and an employer
 * with no line on the work used to tick the step while its required "What you
 * did" sat empty.
 *
 * Mirrors hasEducation() / hasExperience() in the backend resume module.
 */
export const hasStudied = (profile: ResumeCareerProfile | null): boolean =>
  profileEducation(profile).some((row) => has(row.title) && has(row.place));
export const hasDoneSomething = (profile: ResumeCareerProfile | null): boolean =>
  profileExperience(profile).some((row) => has(row.title) && has(row.detail));

export type StudyDraft = { qualification: string; institution: string; from: string; to: string; current: boolean; marks: string };
export type WorkDraft = { kind: string; title: string; organisation: string; from: string; to: string; detail: string; scope: string; tools: string; outcome: string; evidenceSource: string };

export const BLANK_STUDY: StudyDraft = { qualification: "", institution: "", from: "", to: "", current: false, marks: "" };
export const BLANK_WORK: WorkDraft = { kind: "", title: "", organisation: "", from: "", to: "", detail: "", scope: "", tools: "", outcome: "", evidenceSource: "" };

/**
 * Where the education form starts. Blank once they have a row; before that,
 * filled from the profile page's fields, so the form shows what the profile
 * already says and saving it turns it into a row.
 */
export function studyDraft(profile: ResumeCareerProfile | null): { draft: StudyDraft; fromProfile: boolean } {
  const p = profile?.preferences ?? {};
  if ((profile?.education ?? []).length > 0 || (!has(p.institution) && !has(p.course))) return { draft: BLANK_STUDY, fromProfile: false };
  return {
    draft: {
      ...BLANK_STUDY,
      qualification: text(p.course),
      institution: text(p.institution),
      // A year of study or an expected finish means they are there now.
      current: has(p.yearOfStudy) || has(p.expectedFinish),
      marks: text(p.collegePercent),
    },
    fromProfile: true,
  };
}

/**
 * Where the "what you have done" form starts. Blank once they have an
 * experience or project row; before that, the first of: their current role,
 * their internship, their activities.
 */
export function workDraft(profile: ResumeCareerProfile | null): { draft: WorkDraft; fromProfile: boolean } {
  const p = profile?.preferences ?? {};
  if ((profile?.experience ?? []).length > 0 || (profile?.projects ?? []).length > 0) return { draft: BLANK_WORK, fromProfile: false };
  if (has(p.currentRole) || has(p.employer)) return { draft: { ...BLANK_WORK, kind: "job", title: text(p.currentRole), organisation: text(p.employer) }, fromProfile: true };
  if (has(p.internshipExperience)) return { draft: { ...BLANK_WORK, kind: "internship", title: "Internship", detail: text(p.internshipExperience) }, fromProfile: true };
  if (has(p.activities)) return { draft: { ...BLANK_WORK, kind: "club", title: "Activities", detail: text(p.activities) }, fromProfile: true };
  return { draft: BLANK_WORK, fromProfile: false };
}

/** A saved education entry as the form shows it, for editing in place. */
export function studyFromRow(row: Record<string, unknown> | undefined): StudyDraft {
  if (!row) return BLANK_STUDY;
  return {
    qualification: text(row.qualification) || text(row.course),
    institution: text(row.institution),
    from: text(row.from),
    to: text(row.to),
    current: row.current === true || text(row.current).toLowerCase() === "yes",
    marks: text(row.marks),
  };
}

/** A saved experience entry as the form shows it, for editing in place. */
export function workFromRow(row: Record<string, unknown> | undefined): WorkDraft {
  if (!row) return BLANK_WORK;
  return {
    kind: text(row.kind),
    title: text(row.title),
    organisation: text(row.organisation),
    from: text(row.from),
    to: text(row.to),
    detail: text(row.detail),
    scope: text(row.scope),
    tools: text(row.tools),
    outcome: text(row.outcome),
    evidenceSource: text(row.evidenceSource),
  };
}
