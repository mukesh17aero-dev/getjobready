// What a marketing feature entry is, and when it counts as open.

export type FeatureStatus =
  /** Shipped. Someone can open it and finish something with it today. */
  | "live"
  /** The route exists and is a placeholder. Being worked on now. */
  | "building"
  /** Specified, not started. */
  | "planned";

/**
 * One section of a feature's walkthrough - the panel beside the list steps
 * through these in order.
 *
 * `art` names a live example rather than holding one: this file is data, and
 * the components that render a resume or an interview read-out live in
 * components/. The panel maps the name to the real renderer, so a walkthrough
 * can never show a document the product does not actually produce.
 */
export type Beat = {
  /** Rail label. One word where possible - it is a signpost, not a summary. */
  tab: string;
  head: string;
  body: string;
  points?: string[];
  art?:
    | "resume-output"
    | "resume-read"
    | "resume-scribe"
    | "resume-ats"
    | "interview-output"
    | "interview-audio"
    | "interview-setup"
    | "interview-answer"
    | "discovery-role"
    | "discovery-chat"
    | "discovery-industries"
    | "discovery-tour"
    | "discovery-shortlist"
    | "readiness-scene"
    | "readiness-help"
    | "readiness-report"
    | "readiness-ai"
    | "story-questions"
    | "story-drafter"
    | "story-grid"
    | "story-refine"
    | "practice-library"
    | "practice-answer"
    | "practice-note"
    | "practice-progress"
    | "fit-dashboard"
    | "fit-paste"
    | "fit-lines"
    | "fit-actions"
    | "profile-compare"
    | "profile-identity"
    | "profile-skills"
    | "profile-keep";
};

export type Feature = {
  id: string;
  title: string;
  /** One line on the card: what it does, in the second person. */
  blurb: string;
  status: FeatureStatus;
  /** Where it opens. Null while it has nowhere to go. */
  href: string | null;
  /** Roughly how long a first pass takes. Null when nobody can say yet. */
  time: string | null;
  /** Detail panel: what the thing actually is. */
  about: string;
  /** Detail panel: who it is for - and, honestly, who it is not for. */
  forWho: string;
  /** Detail panel: what you walk away holding. */
  expect: string;
  /**
   * The full walkthrough, for features that are built. Absent on anything
   * unreleased: "how to read the result" and "what to do next" cannot be
   * written for a thing that produces no result, and inventing them is how a
   * landing page starts lying.
   */
  walkthrough?: Beat[];
};

export type FeatureCategory = {
  id: string;
  /** The category, named as a job to be done rather than a product noun. */
  title: string;
  /** The stake: why this matters, before anything is asked of anyone. */
  stake: string;
  features: Feature[];
};

export const STATUS_LABEL: Record<FeatureStatus, string> = {
  live: "Available now",
  building: "In development",
  planned: "Not released yet",
};

/** Whether a card can be opened at all. */
export const isOpen = (f: Feature): boolean =>
  f.status === "live" && f.href !== null;
