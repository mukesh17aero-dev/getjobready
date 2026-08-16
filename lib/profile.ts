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

const TRACK_ESSENTIALS: Record<Track, FieldSpec[]> = {
  student: [
    { key: "institution", label: "Your college" },
    { key: "course", label: "What you're studying" },
    { key: "yearOfStudy", label: "Year of study" },
  ],
  early_career: [
    { key: "currentRole", label: "Your current or last role" },
    { key: "experienceMonths", label: "How long you've worked" },
    { key: "noticePeriod", label: "When you could start" },
  ],
};

// Which fields count towards "complete" for this person — never the other
// track's questions.
function relevantKeys(track: Track | ""): Array<keyof ProfileFields> {
  const shared: Array<keyof ProfileFields> = [
    "fullName",
    "city",
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
  if (track === "student") {
    return [
      ...shared,
      "institution",
      "course",
      "yearOfStudy",
      "expectedFinish",
      "internshipMonths",
      "internshipExperience",
    ];
  }
  if (track === "early_career") {
    return [
      ...shared,
      "currentRole",
      "employer",
      "experienceMonths",
      "noticePeriod",
      "reasonForChange",
    ];
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
  "employer",
  "internshipExperience",
];

// Every counted question, in the words the form uses for it.
const FIELD_LABELS: Partial<Record<keyof ProfileFields, string>> = {
  fullName: "your name",
  city: "where you are",
  languages: "languages you speak",
  skills: "your skills",
  activities: "activities beyond work",
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
  if (!fields.track) return 0;
  const keys = relevantKeys(fields.track).filter(
    (k) => !OPTIONAL_KEYS.includes(k),
  );
  const filled = keys.filter((k) => String(fields[k] ?? "").trim()).length;
  // the track choice itself counts as one answered question
  return Math.round(((filled + 1) / (keys.length + 1)) * 100);
}
