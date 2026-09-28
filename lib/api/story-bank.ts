// Interview Story Bank.
//
// Part of the typed contract with the Ascend API. One file per backend
// module; lib/api/index.ts is the barrel every caller imports.

// ---- Interview Story Bank (story-bank module) ----
//
// A story is what somebody can actually say in an interview. Two fields carry
// the design and both come from the server: `evidence.proof` says whether it
// rests on something they were shown doing or on their own account, and
// `spokenAt` is null until they have told it out loud. A drafted story nobody
// has said is a script, and the UI marks it as one.

import { API_URL, requestHeaders } from "./core";
import { apiCall, generateCall } from "./core";
export type StarPart = "situation" | "task" | "action" | "result";
export type Star = Partial<Record<StarPart, string>>;

export type StoryEvidence = {
  kind: "simulation" | "interview" | "passport" | "resume" | "told";
  label: string;
  ref?: string | null;
  proof: boolean;
};

export type Story = {
  id: string;
  title: string;
  competency: string;
  star: Star;
  evidence: StoryEvidence;
  roles: string[];
  answers: string[];
  spokenAt: string | null;
  updatedAt: string;
};

export type StoryStrength = "proven" | "usable" | "draft";

/** Mirrors strength() in the backend module - one rule, stated in both places. */
export const storyStrength = (s: Story): StoryStrength =>
  !s.spokenAt ? "draft" : s.evidence.proof ? "proven" : "usable";

export type PracticeQuestion = {
  id: string;
  q: string;
  round: "hr" | "managerial";
  competency: string;
  testing: string;
  roles: string[];
  /** Stories of theirs that answer it. Empty means nothing to say yet. */
  storyIds: string[];
};

export type StoryCoverage = {
  competency: string;
  best: StoryStrength | null;
  storyIds: string[];
  questions: number;
};

export type StoryBank = {
  stories: Story[];
  competencies: string[];
  coverage: StoryCoverage[];
  questions: PracticeQuestion[];
  roleId: string | null;
};

/** A draft, or a plain refusal. Both are real answers about their record. */
export type StoryDraft =
  | {
      questionId: string;
      ok: true;
      draft: {
        title: string;
        star: Star;
        evidence: StoryEvidence;
        missing: StarPart[];
      };
    }
  | { questionId: string; ok: false; reason: string; suggest: string };

/**
 * Filling in the blank parts of a story that's already saved. `patch` only
 * ever carries keys for parts that were blank - a part the person already
 * wrote is never in it, and never touched.
 */
export type StoryExpansion =
  | {
      storyId: string;
      ok: true;
      expansion: {
        patch: Star;
        missing: StarPart[];
        evidence: StoryEvidence;
      };
    }
  | { storyId: string; ok: false; reason: string };

/**
 * The question library on its own, served to anybody.
 *
 * Reading what an interview asks is reading, and reading is free. Nothing in
 * this response is personal - it is the same list for everyone - so it takes
 * no token and needs no account.
 */
export type QuestionState = "weak" | "solid" | "unattempted";

/** A question as the library shows it: what it is, and where you stand on it. */
export type LibraryQuestion = Omit<PracticeQuestion, "storyIds"> & {
  state: QuestionState;
  attempts: number;
  /** The one note from the last attempt. Null when there was nothing to say. */
  note: string | null;
  hasStory: boolean;
};

export type QuestionLibrary = {
  questions: LibraryQuestion[];
  total: number;
  competencies: string[];
  signedIn: boolean;
};

/** One attempt at a question, and the single note that came back. */
export type PracticeAttempt = {
  id: string;
  questionId: string;
  answer: string;
  answeredVia: "text" | "voice";
  note: string | null;
  heldUp: boolean | null;
  createdAt: string;
};

export async function getPracticeQuestions(
  token?: string | null,
): Promise<QuestionLibrary | null> {
  try {
    const res = await fetch(`${API_URL}/v1/practice-questions`, {
      cache: "no-store",
      headers: requestHeaders({ token }),
    });
    if (!res.ok) return null;
    return (await res.json()) as QuestionLibrary;
  } catch {
    return null;
  }
}

export const answerPracticeQuestion = (
  token: string,
  id: string,
  answer: string,
) =>
  apiCall<PracticeAttempt>(token, `/v1/practice-questions/${id}/answer`, {
    method: "POST",
    body: { answer, via: "text" },
  });

export const getStoryBank = (token: string) =>
  apiCall<StoryBank>(token, "/v1/stories");

export const draftStory = (token: string, questionId: string) =>
  apiCall<StoryDraft>(token, "/v1/stories/draft", {
    method: "POST",
    body: { questionId },
  });

/**
 * Fill in the blank parts of a story that's already saved, from this
 * person's own record. Uses generateCall rather than apiCall: this is an AI
 * generation call and deserves the same ninety-second deadline and honest
 * `{ ok: false, reason }` failure shape as any other one, not an opaque null.
 */
export const expandStory = (token: string, storyId: string) =>
  generateCall<StoryExpansion>(token, `/v1/stories/${storyId}/expand`, {});

export const saveStory = (
  token: string,
  body: {
    title: string;
    competency: string;
    star: Star;
    evidence: StoryEvidence;
    answers?: string[];
    /** Only true when they have just told it. Never set on their behalf. */
    spoken?: boolean;
  },
) => apiCall<Story>(token, "/v1/stories", { method: "POST", body });

export const patchStory = (
  token: string,
  id: string,
  body: { title?: string; star?: Star; competency?: string; spoken?: true },
) => apiCall<Story>(token, `/v1/stories/${id}`, { method: "PATCH", body });
