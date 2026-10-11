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

/** The three ways this builder is used, said out loud as equals. */
export type Making = "role" | "general" | "improve";

export const MAKING_OPTIONS: Array<{ id: Making; label: string }> = [
  { id: "general", label: "A general resume - no particular role" },
  { id: "role", label: "A resume for a particular role" },
  { id: "improve", label: "Improve a resume I already have" },
];



export type LedgerEntry = {
  role: string;
  at: string;
  skillsHighlighted?: string[];
  resume?: ResumeData;
  template?: ResumeTemplate;
  displayTemplate?: ResumeTemplate;
  /** When they took it away, if they have. */
  downloadedAt?: string;
  /** The read-out they were given on the version they downloaded. */
  review?: ResumeReview;
  /** The job posting it was tailored to, so reopening it keeps the target. */
  jobDescription?: string;
};

// The read-out takes a few seconds because a model is genuinely reading the
// resume. A single frozen sentence reads as hung, so the wait narrates what
// is being done - and says plainly that it is worth staying for.
