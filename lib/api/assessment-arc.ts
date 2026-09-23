// Assessment arcs (admin authoring surface).
//
// Part of the typed contract with the Ascend API. One file per backend
// module; lib/api/index.ts is the barrel every caller imports.

// ---- Assessment arcs (admin, assessment-arc module) ----
//
// The first thirty days, per role. Two prompts: the built-in one is the
// product's opinion about what an assessment is and is read-only; the optional
// one is the admin's and is subordinate to it.

import type { AssistTurn } from "./assessment-run";
import type { AnswerSignals } from "./integrity";
export type ArcSupport = "both" | "assistant" | "buddy" | "none";
export type ArcAnswer = "typed" | "spoken" | "artefact";

export type SceneInteraction =
  | { kind: "routing"; choices: Array<{ id: string; label: string; detail?: string }>; messageLabel: string }
  | { kind: "prioritisation"; items: Array<{ id: string; label: string; detail?: string }>; reasonLabel: string }
  | { kind: "handover"; fields: Array<{ id: string; label: string; options?: string[]; required?: boolean }> };

export type InteractionResponse =
  | { kind: "routing"; choiceId: string; message: string }
  | { kind: "prioritisation"; orderedIds: string[]; reason: string }
  | { kind: "handover"; values: Record<string, string> };

export type AssessmentAnswerDraft = {
  integrity?: AnswerSignals;
  sceneId: string;
  response: string;
  answeredVia?: ArcAnswer;
  seconds?: number;
  askedAssistantAtSeconds?: number;
  askedBuddyAtSeconds?: number;
  helpLog?: { assistant?: AssistTurn[]; buddy?: AssistTurn[] };
  interactionResponse?: InteractionResponse;
};

export type ArcScene = {
  interaction?: SceneInteraction;
  id: string;
  day: string;
  title: string;
  brief: string;
  minutes: number;
  support: ArcSupport;
  answer: ArcAnswer;
  fields: string[];
  measures: string[];
  /** Admin-only checks for the answer; separate from role skill mappings. */
  criteria?: string[];
  easier?: string;
  harder?: string;
  /** Which workplace this scene belongs to. A sitting is served from one. */
  team?: string;
  /** Whether this scene is worth drawing. Most are not. */
  needsImage?: boolean;
  /** What to draw, in a picture's terms rather than the task's. */
  imageBrief?: string;
  /** Set when this scene repeats an earlier one, harder. */
  repeatsSceneId?: string;
  /**
   * A picture of the situation, in our own bucket. Drawn only when an admin
   * asks. Most scenes do not need one - a picture earns its place when the
   * work is visual and is noise when it is not.
   */
  image?: string;
};

/** One workplace the role can be done in. A sitting happens in exactly one. */
export type ArcTeam = {
  id: string;
  industry: string;
  company: string;
  buddy: string;
};

export type AssessmentArc = {
  roleId: string;
  roleTitle: string;
  /** Absent on arcs published before teams existed. */
  teams?: ArcTeam[];
  company: string;
  buddy: string;
  scenes: ArcScene[];
  skills: string[];
};

export type ArcBank = { arcs: AssessmentArc[] };

export type ArcGenerateResult =
  | { ok: true; arc: AssessmentArc; warnings: string[] }
  | { ok: false; reason: string };
