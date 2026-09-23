"use client";

// The words the builder uses about standing, next steps and what Scribe can be asked for.

// How the review's verdict reads on screen, and where its one next step
// leads. Plain words, no score - a resume is not a number.
export type Standing = "early" | "competitive" | "strong";

export const STANDING_LABEL: Record<Standing, string> = {
  early: "This is an honest start, and thin for the bar this role sets.",
  competitive: "This holds up against what this role usually asks for.",
  strong: "This is strong for the role - it carries real evidence.",
};

// A resume aimed at no role has no role's bar to be measured against, and
// saying "this role" over a resume they deliberately left open is us
// forgetting what they asked for.
export const STANDING_LABEL_GENERAL: Record<Standing, string> = {
  early: "This is an honest start, and thin for what most hiring reads like.",
  competitive: "This holds up in front of most people who would read it.",
  strong: "This is strong - it carries real evidence, whoever reads it.",
};

import { type ResumeData, type ResumeReview, type ResumeTemplate } from "./resume-api";
export const standingLabel = (level: Standing, targetRole: string): string =>
  targetRole ? STANDING_LABEL[level] : STANDING_LABEL_GENERAL[level];

/** The three ways this builder is used, said out loud as equals. */
export type Making = "role" | "general" | "improve";

export const MAKING_OPTIONS: Array<{ id: Making; label: string }> = [
  { id: "general", label: "A general resume - no particular role" },
  { id: "role", label: "A resume for a particular role" },
  { id: "improve", label: "Improve a resume I already have" },
];

export const NEXT_STEP_HREF: Record<string, string> = {
  readiness: "/practice",
  practice: "/practice",
  interview: "/interview",
  profile: "/profile",
};

export const NEXT_STEP_LABEL: Record<string, string> = {
  readiness: "Prove these skills →",
  practice: "Do the real work →",
  interview: "Rehearse for it →",
  profile: "Fill in what is missing →",
};

// What can be asked for, shown one at a time in Scribe's own box - a person
// who has never edited a resume does not know that "this one is not true" is
// a thing they are allowed to say.
export const SCRIBE_EXAMPLES = [
  "Make the profile shorter",
  "Move the college fest above the store job",
  "Add that I handled about 60 customers a day",
  "This bullet is not true - take it out",
  "Say more about the stock work",
];

export type LedgerEntry = {
  role: string;
  at: string;
  skillsHighlighted?: string[];
  resume?: ResumeData;
  template?: ResumeTemplate;
  /** When they took it away, if they have. */
  downloadedAt?: string;
  /** The read-out they were given on the version they downloaded. */
  review?: ResumeReview;
};

// One turn of the revision loop, kept so the change log can show what was
// asked, what happened, and can put any change back.
export type Revision = {
  ask: string;
  /** What Scribe said back - always present. */
  reply: string;
  changed: string[];
  /** Whether the document actually differs from `before`. The model does not
      always describe what it did, but the page can always tell. */
  didChange: boolean;
  /** Facts this instruction brought in, which are the person's own claim. */
  added: string[];
  /** One question that would make the change stronger, if there was one. */
  followUp?: string;
  declined: string | null;
  /** The resume as it was BEFORE this revision, for "Put it back". */
  before: ResumeData;
};

// The read-out takes a few seconds because a model is genuinely reading the
// resume. A single frozen sentence reads as hung, so the wait narrates what
// is being done - and says plainly that it is worth staying for.
