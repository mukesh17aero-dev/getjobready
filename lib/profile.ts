import type { CareerProfile } from "@/lib/api";

// Two audiences enter the product (Blueprint: students, freshers and early
// career 0–3 yrs), and they answer different questions. A student has a course
// and a finish date; someone already working has a job title and a notice
// period. Asking one group the other's questions is the fastest way to lose
// them, so the profile branches on the track and never shows both.

export type Track = "student" | "early_career";

export type ProfileFields = {
  track: Track | "";
  // shared
  fullName: string;
  city: string;
  /**
   * The two contact details a resume needs and nothing was asking for.
   *
   * A resume with no phone number on it is a resume nobody rings, and the
   * header had nowhere to put one - the CV importer has always been able to
   * find a phone in an uploaded file, and then had no field to write it to.
   */
  phone: string;
  /** LinkedIn or a portfolio. One link; more than one is clutter. */
  link: string;
  languages: string;
  skills: string;
  activities: string;
  workPreference: string;
  earliestStart: string;
  interestedSpaces: string;
  aspirations: string;
  tenthPercent: string;
  twelfthPercent: string;
  collegePercent: string;
  favSubjectsSchool: string;
  favSubjectsCollege: string;
  // student
  institution: string;
  course: string;
  yearOfStudy: string;
  expectedFinish: string;
  internshipMonths: string;
  internshipExperience: string;
  // already working
  currentRole: string;
  employer: string;
  experienceMonths: string;
  noticePeriod: string;
  reasonForChange: string;
};

export const EMPTY_PROFILE: ProfileFields = {
  track: "",
  fullName: "",
  city: "",
  phone: "",
  link: "",
  languages: "",
  skills: "",
  activities: "",
  workPreference: "",
  earliestStart: "",
  interestedSpaces: "",
  aspirations: "",
  tenthPercent: "",
  twelfthPercent: "",
  collegePercent: "",
  favSubjectsSchool: "",
  favSubjectsCollege: "",
  institution: "",
  course: "",
  yearOfStudy: "",
  expectedFinish: "",
  internshipMonths: "",
  internshipExperience: "",
  currentRole: "",
  employer: "",
  experienceMonths: "",
  noticePeriod: "",
  reasonForChange: "",
};

/**
 * Where somebody actually is, worked out from what is on their page rather
 * than from what they ticked. The entries are the evidence: a course in
 * progress, a job that exists.
 *
 * Only the two certain cases are decided here. Somebody with no course in
 * progress and no work added is a fresher by default, but if they have said
 * otherwise that stands - they may simply not have typed the job in yet, and
 * overruling a person about their own life on missing evidence is worse than
 * leaving their answer alone.
 */
export function trackFromRecord(args: {
  studyingNow: boolean;
  hasWork: boolean;
  chosen?: Track | "" | null;
}): Track {
  if (args.studyingNow) return "student";
  if (args.hasWork) return "early_career";
  return args.chosen === "early_career" ? "early_career" : "student";
}

export const TRACKS: Array<{
  id: Track;
  title: string;
  blurb: string;
  who: string;
}> = [
  {
    id: "student",
    title: "I'm studying",
    blurb: "In college or just finished, no full-time job yet.",
    who: "Student or fresher",
  },
  {
    id: "early_career",
    title: "I'm working or job-hunting",
    blurb: "Up to three years of work behind me, looking for what's next.",
    who: "Early career, 0–3 yrs",
  },
];

export const YEARS_OF_STUDY = ["1st year", "2nd year", "3rd year", "Final year", "Finished"];
export const WORK_PREFERENCES = ["On-site", "Hybrid", "Either is fine"];
export const NOTICE_PERIODS = ["Available now", "15 days", "30 days", "60 days or more"];

// The frontline white-collar worlds the catalogue's roles live in. Multi-
// select: interest is rarely singular, and matches improve with honesty.
export const BUSINESS_SPACES = [
  "E-commerce & Quick Commerce",
  "Banking & Financial Services",
  "Retail & Consumer",
  "Logistics & Supply Chain",
  "Hospitality & Travel",
  "Healthcare Services",
  "IT & SaaS Support",
  "EdTech & Training",
];

type FieldSpec = { key: keyof ProfileFields; label: string };

const SHARED_ESSENTIALS: FieldSpec[] = [
  { key: "fullName", label: "Your name" },
  { key: "city", label: "Where you are" },
  { key: "skills", label: "Your skills" },
];

// One profile, whoever you are. The old form asked a student about their
// college and someone working about their employer, in two separate sets of
// boxes - which meant a student with a part-time job had nowhere to put it,
// and someone studying while working had to pick a side. Schooling and jobs
// are now lists anybody can add to, and being empty says something true
// rather than being a gap in the form.
const TRACK_ESSENTIALS: Record<Track, FieldSpec[]> = {
  student: [],
  early_career: [{ key: "noticePeriod", label: "When you could start" }],
};

// Which fields count towards "complete" for this person — never the other
// track's questions.
function relevantKeys(track: Track | ""): Array<keyof ProfileFields> {
  const shared: Array<keyof ProfileFields> = [
    "fullName",
    "city",
    "phone",
    "languages",
    "skills",
    "activities",
    "workPreference",
    // earliestStart stays in the type for stored data, but the form never
    // asks it - counting it made 100% unreachable.
    "interestedSpaces",
    "aspirations",
    "tenthPercent",
    "twelfthPercent",
    "collegePercent",
    "favSubjectsSchool",
    "favSubjectsCollege",
  ];
  // Everyone is asked the same questions now. The only fork left is the one
  // that genuinely differs: someone already working has a notice period and
  // a reason for moving; someone who has never worked has neither.
  if (track === "early_career") {
    return [...shared, "noticePeriod", "reasonForChange"];
  }
  return shared;
}

export function toFields(profile: CareerProfile | null): ProfileFields {
  if (!profile) return EMPTY_PROFILE;
  const prefs = (profile.preferences ?? {}) as Partial<ProfileFields>;
  return { ...EMPTY_PROFILE, ...prefs };
}

// What the reflection is allowed to see: the track choice plus exactly the
// questions this person was asked - mandatory and optional alike, never the
// other track's leftovers.
export function reflectionAnswers(fields: ProfileFields): Record<string, string> {
  const out: Record<string, string> = {};
  if (fields.track) out.track = fields.track;
  for (const key of relevantKeys(fields.track)) {
    const value = String(fields[key] ?? "").trim();
    if (value) out[key] = value;
  }
  return out;
}

export function missingEssentials(fields: ProfileFields): string[] {
  if (!fields.track) return ["Which describes you"];
  return [...SHARED_ESSENTIALS, ...TRACK_ESSENTIALS[fields.track]]
    .filter(({ key }) => !String(fields[key] ?? "").trim())
    .map((f) => f.label);
}

// Fields the form itself marks optional: leaving them empty must never
// keep someone from 100%.
const OPTIONAL_KEYS: Array<keyof ProfileFields> = [
  "activities",
  "link",
  "employer",
  "internshipExperience",
  "reasonForChange",
  // Filled from the education entries rather than asked for again.
  "tenthPercent",
  "twelfthPercent",
  "collegePercent",
];

// Every counted question, in the words the form uses for it.
export const FIELD_LABELS: Partial<Record<keyof ProfileFields, string>> = {
  fullName: "your name",
  city: "where you are",
  phone: "your phone number",
  link: "your LinkedIn or portfolio link",
  languages: "languages you speak",
  skills: "your skills",
  activities: "anything else you do",
  workPreference: "work preference",
  interestedSpaces: "business spaces that interest you",
  aspirations: "your aspirations",
  institution: "your college",
  course: "what you're studying",
  yearOfStudy: "year of study",
  expectedFinish: "when you finish",
  internshipMonths: "internship months",
  currentRole: "your current or last role",
  experienceMonths: "how long you've worked",
  noticePeriod: "when you could start",
  reasonForChange: "what you're looking for",
  tenthPercent: "your 10th marks",
  twelfthPercent: "your 12th marks",
  collegePercent: "your college marks",
  favSubjectsSchool: "favourite subjects in school",
  favSubjectsCollege: "favourite subjects in college",
};

// The unfilled questions that stand between this person and 100% - the
// same set the percentage counts, so the two can never disagree.
export function missingForCompletion(fields: ProfileFields): string[] {
  if (!fields.track) return ["which describes you"];
  return relevantKeys(fields.track)
    .filter((k) => !OPTIONAL_KEYS.includes(k))
    .filter((k) => !String(fields[k] ?? "").trim())
    .map((k) => FIELD_LABELS[k] ?? k);
}

export function completeness(fields: ProfileFields): number {
  // Nought until a track is chosen was wrong, and it was the first number
  // somebody saw: upload a CV that fills in your name, city, schooling and
  // skills, skip the "which describes you" question, and the bar still read
  // "0% complete". The track decides which questions are RELEVANT, not
  // whether the answers already given count - so without one, the shared
  // questions everybody is asked are what it is measured against.
  const keys = (
    fields.track ? relevantKeys(fields.track) : relevantKeys("")
  ).filter((k) => !OPTIONAL_KEYS.includes(k));
  const filled = keys.filter((k) => String(fields[k] ?? "").trim()).length;
  // The track choice is itself one of the questions - answered or not.
  const answered = filled + (fields.track ? 1 : 0);
  return Math.round((answered / (keys.length + 1)) * 100);
}

// ---- Repeatable history ----
//
// Schooling and jobs are lists, not single fields: a person has a tenth,
// a twelfth and a degree, or three jobs across five years. These live in the
// career record's own `education` and `experience` arrays - the same arrays
// the resume reads - rather than in the flat preference fields, so adding a
// second one does not mean inventing `institution2`.

export type EducationEntry = {
  qualification: string;
  institution: string;
  from: string;
  to: string;
  /** Still studying here - the "to" year does not exist yet. */
  current: string;
  /** Kept apart because they are different kinds of thing: one is a number
      that can be checked, the other is words that cannot. */
  marks: string;
  stream: string;
};

export type ExperienceEntry = {
  /** Job, internship, freelance, volunteering - a recruiter reads these
      very differently, and a resume that blurs them oversells the person. */
  kind: string;
  title: string;
  organisation: string;
  from: string;
  to: string;
  /** Still there. A year range cannot say "now", so this does. */
  current: string;
  detail: string;
};

export const WORK_KINDS = [
  { id: "job", label: "Job" },
  { id: "internship", label: "Internship" },
  { id: "apprenticeship", label: "Apprenticeship" },
  { id: "freelance", label: "Freelance" },
  { id: "family", label: "Family business" },
  { id: "volunteering", label: "Volunteering" },
] as const;

export const workKindLabel = (id: string): string =>
  WORK_KINDS.find((k) => k.id === id)?.label ?? "Work";

const text = (row: Record<string, unknown>, key: string): string =>
  typeof row[key] === "string" ? (row[key] as string) : "";

export const emptyEducation = (): EducationEntry => ({
  qualification: "",
  institution: "",
  from: "",
  to: "",
  current: "",
  marks: "",
  stream: "",
});

/** "2021 - 2024", "2023 - present", or just a start year. */
export function periodFrom(entry: { from: string; to: string; current: string }): string {
  const from = entry.from.trim();
  const to = entry.current ? "present" : entry.to.trim();
  if (from && to) return `${from} - ${to}`;
  return from || to || "";
}

/** Split a stored "2021 - 2024" back into its parts for the form. */
function splitPeriod(period: string): { from: string; to: string; current: string } {
  const [from = "", to = ""] = period.split(/\s*[-–to]+\s*/i).map((part) => part.trim());
  const present = /present|current|now|ongoing/i.test(to);
  return { from, to: present ? "" : to, current: present ? "yes" : "" };
}

export const emptyExperience = (): ExperienceEntry => ({
  kind: "job",
  title: "",
  organisation: "",
  from: "",
  to: "",
  current: "",
  detail: "",
});

export function readEducation(
  rows: Array<Record<string, unknown>> | undefined,
): EducationEntry[] {
  return (rows ?? []).map((row) => ({
    qualification: text(row, "qualification"),
    institution: text(row, "institution"),
    ...splitPeriod(text(row, "period")),
    // Rows saved before these were separate carry it all in `detail`.
    marks: text(row, "marks") || (text(row, "detail").match(/\d{1,3}(?:\.\d+)?(?=\s*%)/)?.[0] ?? ""),
    stream: text(row, "stream") || text(row, "detail").replace(/\d{1,3}(?:\.\d+)?\s*%/g, "").replace(/^[\s,-]+|[\s,-]+$/g, ""),
  }));
}

/**
 * The record keeps `detail` as one line because that is what a resume prints,
 * and the two parts beside it so the form can ask for them separately.
 */
export function educationForRecord(entry: EducationEntry): Record<string, string> {
  const detail = [entry.stream.trim(), entry.marks.trim() ? `${entry.marks.trim()}%` : ""]
    .filter(Boolean)
    .join(", ");
  return {
    qualification: entry.qualification.trim(),
    institution: entry.institution.trim(),
    period: periodFrom(entry),
    marks: entry.marks.trim(),
    stream: entry.stream.trim(),
    detail,
  };
}

export function readExperience(
  rows: Array<Record<string, unknown>> | undefined,
): ExperienceEntry[] {
  return (rows ?? []).map((row) => ({
    kind: text(row, "kind") || "job",
    title: text(row, "title"),
    organisation: text(row, "organisation"),
    ...splitPeriod(text(row, "period")),
    detail: text(row, "detail"),
  }));
}

/** The record keeps one period string, because that is what a resume prints. */
export function experienceForRecord(entry: ExperienceEntry): Record<string, string> {
  return {
    kind: entry.kind,
    title: entry.title.trim(),
    organisation: entry.organisation.trim(),
    period: periodFrom(entry),
    detail: entry.detail.trim(),
  };
}

/**
 * The three percentage fields the rest of the product reads, worked out from
 * the education entries rather than asked for a second time. Someone who has
 * typed 78% against their Class XII should never be asked for it again three
 * questions later.
 */
export function marksFromEducation(
  entries: EducationEntry[],
): Pick<ProfileFields, "tenthPercent" | "twelfthPercent" | "collegePercent"> {
  const found = { tenthPercent: "", twelfthPercent: "", collegePercent: "" };
  for (const entry of entries) {
    const marks = entry.marks.trim();
    if (!marks) continue;
    const what = `${entry.qualification} ${entry.stream}`.toLowerCase();
    if (/\b(10|x|tenth|sslc|matric)\b/.test(what)) found.tenthPercent ||= marks;
    else if (/\b(12|xii|twelfth|hsc|intermediate|senior secondary|puc)\b/.test(what))
      found.twelfthPercent ||= marks;
    else found.collegePercent ||= marks;
  }
  return found;
}

/** An entry with nothing in it is not saved - a blank row is not a fact. */
export const hasSubstance = (entry: Record<string, string>): boolean =>
  Object.entries(entry).some(([key, value]) => key !== "kind" && key !== "current" && value.trim().length > 0);
