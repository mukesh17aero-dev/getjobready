// Sitting the readiness assessment.
//
// Part of the typed contract with the Ascend API. One file per backend
// module; lib/api/index.ts is the barrel every caller imports.

// ---- Sitting the readiness assessment (assessment-run module) ----
//
// A scene as the person sitting it sees it. `measures` and the easier/harder
// variants are deliberately absent: telling somebody what is being looked for
// is the fastest way to measure the wrong thing.

import type { ArcAnswer, ArcGenerateResult, ArcSupport, ArcTeam, AssessmentAnswerDraft, SceneInteraction } from "./assessment-arc";
import { API_URL, requestHeaders } from "./core";
import { apiCall, generateCall } from "./core";
export type StudentScene = {
  interaction?: SceneInteraction;
  id: string;
  day: string;
  title: string;
  brief: string;
  minutes: number;
  support: ArcSupport;
  answer: ArcAnswer;
  fields: string[];
  image?: string;
};

export type RunState = {
  serverNow?: string;
  begunAt?: string | null;
  deadlineAt?: string | null;
  timeLimitSeconds?: number;
  questionLimit?: number | null;
  draft?: AssessmentAnswerDraft | null;
  runId: string;
  roleId: string;
  company: string;
  buddy: string;
  /**
   * The scene to do now, or null when the sitting is finished.
   *
   * One at a time, not a list: the next scene is chosen from how this one
   * went, so there is no plan for the client to hold.
   */
  scene: StudentScene | null;
  answered: number;
  estimatedRemaining: number;
  startedAt: string;
  finishedAt: string | null;
};

/** The acknowledgement of an answer carries the next scene with it. */
export type AnswerAccepted = {
  recorded: boolean;
  expired?: boolean;
  scene: StudentScene | null;
  answered: number;
  remaining: number;
};

/**
 * What a finished sitting shows. Counts of evidence, never marks: one sitting
 * cannot establish proficiency, so nothing here is a score.
 */
export type Readout = {
  runId: string;
  roleId: string;
  finishedAt: string | null;
  scenesAttempted: number;
  scenesInSitting: number;
  minutesSpent: number;
  skills: Array<{ skill: string; attempted: number; inSitting: number }>;
  reachedFor: Array<{
    sceneTitle: string;
    assistantAtSeconds: number | null;
    buddyAtSeconds: number | null;
  }>;
  repeated: Array<{ sceneTitle: string; attempts: number }>;
};

/**
 * A read of what somebody wrote, with scores.
 *
 * `basis` and `confidence` travel with the numbers on purpose: a readiness
 * score from a sitting where half the scenes went unattempted is not the same
 * object as one where they all did, and only these say which. Never render a
 * score without them.
 */
export type AssessmentReview = {
  scenes: Array<{
    sceneId: string;
    did: string;
    better: string;
    attempted: boolean;
  }>;
  skillScores: Array<{ skill: string; score: number; why: string }>;
  /**
   * How they worked with the AI assistant, scored on the same 0-100 scale.
   *
   * Null when the assistant was offered on fewer than two situations they
   * attempted - a reading of AI judgement from one scene is not a reading.
   * It scores the judgement, not the amount of use: not asking at all is a
   * real gap, and sending back the assistant's own words is the worst of the
   * patterns, because the judgement never happened.
   */
  usingAI: { score: number; why: string } | null;
  readiness: { score: number; why: string };
  confidence: "low" | "medium";
  strengths: string[];
  workOn: string[];
  summary: string;
  basis: { scenesAttempted: number; scenesInSitting: number };
};

export type ReviewResult =
  | { ok: true; review: AssessmentReview; fresh: boolean }
  | { ok: false; reason: string };

export const reviewAssessmentRun = (token: string, runId: string) =>
  generateCall<{ ok: true; review: AssessmentReview; fresh: boolean }>(
    token,
    `/v1/assessment/run/${runId}/review`,
    {},
  );

/**
 * The first situation of a role's assessment, to anybody.
 *
 * No token, no run created, nothing kept. It exists so somebody can see what
 * a question actually involves before being asked for an account - the
 * argument for the feature is that it is the job's own work rather than a
 * test, and that is seen in one scene and cannot be told.
 */
export const getAssessmentPreview = (roleId: string) =>
  apiCall<{
    roleId: string;
    company: string;
    buddy: string;
    scene: StudentScene;
  }>("", `/v1/assessment/preview/${roleId}`);

export const getPreviewAssessmentRoles = () =>
  apiCall<{ roles: Array<{ roleId: string; title: string }> }>(
    "",
    "/v1/assessment/preview/roles",
  );

export const startAssessmentRun = (token: string, roleId: string) =>
  apiCall<RunState>(token, "/v1/assessment/run", {
    method: "POST",
    body: { roleId },
  });

export const sendSceneAnswer = (
  token: string,
  runId: string,
  body: AssessmentAnswerDraft,
) =>
  apiCall<AnswerAccepted>(token, `/v1/assessment/run/${runId}/answer`, {
    method: "POST",
    body,
  });

export const saveAssessmentDraft = (token: string, runId: string, body: AssessmentAnswerDraft) =>
  apiCall<{ saved: boolean; expired?: boolean }>(token, `/v1/assessment/run/${runId}/draft`, {
    method: "PUT", body,
  });

/** One turn with the assistant while a scene is open. */
export type AssistTurn = { who: "them" | "assistant"; text: string };

export const askSceneAssistant = (
  token: string,
  runId: string,
  body: {
    sceneId: string;
    question: string;
    conversation: AssistTurn[];
    /** Buddy is retained for legacy clients; the server rejects new buddy requests. */
    who?: "assistant" | "buddy";
  },
) =>
  generateCall<{ ok: true; reply: string }>(
    token,
    `/v1/assessment/run/${runId}/assist`,
    body,
  );

/**
 * The assistant on the preview's first situation, for a visitor with no
 * account. Same three-question limit as a sitting, plus a small allowance
 * per address on the server.
 */
export const askPreviewAssistant = (
  roleId: string,
  body: { sceneId: string; question: string; conversation: AssistTurn[] },
) =>
  generateCall<{ ok: true; reply: string }>(
    "",
    `/v1/assessment/preview/${roleId}/assist`,
    body,
  );

/** A recording, transcribed server-side. Spoken scenes measure what was said. */
export async function transcribeSceneAnswer(
  token: string,
  runId: string,
  audio: Blob,
): Promise<{ text: string } | { error: string }> {
  const form = new FormData();
  form.append("file", audio, "answer.webm");
  try {
    const res = await fetch(`${API_URL}/v1/assessment/run/${runId}/speak`, {
      method: "POST",
      headers: requestHeaders({ token }),
      body: form,
    });
    if (res.ok) return (await res.json()) as { text: string };
    const said = await res
      .json()
      .then((d: { error?: string }) => d?.error ?? "")
      .catch(() => "");
    return { error: said || `The server answered ${res.status}.` };
  } catch {
    return { error: "Could not reach the server." };
  }
}

/**
 * Begin the 5-question assessment.
 *
 * The run exists from the moment the screen opens - the induction needs the
 * company and the buddy - but the clock starts here, when they press go.
 */
export const beginAssessmentRun = (token: string, runId: string) =>
  apiCall<{ serverNow: string; startedAt: string; begunAt: string | null; deadlineAt: string | null; timeLimitSeconds: number; questionLimit: number | null; finishedAt: string | null }>(
    token,
    `/v1/assessment/run/${runId}/begin`,
    { method: "POST", body: {} },
  );

export const finishAssessmentRun = (token: string, runId: string) =>
  apiCall<Readout>(token, `/v1/assessment/run/${runId}/finish`, {
    method: "POST",
    body: {},
  });

export const getAssessmentReadout = (token: string, runId: string) =>
  apiCall<Readout>(token, `/v1/assessment/run/${runId}/readout`);

/**
 * One finished sitting, as a line in a list of them.
 *
 * `readiness` is null when a sitting was never reviewed - a review can fail,
 * and a sitting is complete without one. Null means "not read", never zero.
 */
export type PastRun = {
  runId: string;
  roleId: string;
  roleTitle: string;
  startedAt: string;
  finishedAt: string;
  scenesAttempted: number;
  readiness: number | null;
  confidence: "low" | "medium" | null;
};

export const listAssessmentRuns = (token: string) =>
  apiCall<{ runs: PastRun[] }>(token, "/v1/assessment/runs");

/**
 * A role this person can be assessed on.
 *
 * Every role with a published assessment, not only the one Discovery settled
 * on - somebody weighing up three jobs should be able to see where they stand
 * on each. The API enforces the same list, so a role that reaches the request
 * some other way is refused there rather than merely being absent here.
 */
export type AssessableRole = {
  roleId: string;
  roleTitle: string;
  /** Picked in Discovery, as opposed to simply available. */
  chosen: boolean;
  /** The one Discovery settled on most recently. At most one is true. */
  current: boolean;
  /** Whether anybody has published an assessment for it yet. */
  hasAssessment: boolean;
  sittings: number;
  lastReadiness: number | null;
};

export const listAssessableRoles = (token: string) =>
  apiCall<{ roles: AssessableRole[] }>(token, "/v1/assessment/roles");

/**
 * A line to compare a readiness score against.
 *
 * `source` is the field that matters. "measured" means something counted real
 * rows - stored reviews, or a bar an admin set against a real hiring process.
 * "illustrative" means it is a stand-in until there is data, and it must never
 * be drawn or described as anything else: a number on a chart is read long
 * before its footnote, and this one is read by somebody deciding whether they
 * are employable.
 */
export type ReferenceBand = {
  id: "cohort" | "sixMonths" | "employerBar";
  label: string;
  source: "measured" | "illustrative";
  readiness: number;
  /** Per-skill scores where known; empty means flat at `readiness`. */
  skills: Array<{ skill: string; score: number }>;
  /** How many people it is the mean of. Only ever on a measured band. */
  cohort?: number;
};

export const getRoleBenchmarks = (token: string, roleId: string) =>
  apiCall<{ bands: ReferenceBand[] }>(
    token,
    `/v1/assessment/role/${roleId}/benchmark`,
  );

export const adminArcPrompt = (token: string) =>
  apiCall<{ prompt: string }>(token, "/v1/admin/assessment/arc/prompt");

export const adminGenerateArc = (
  token: string,
  body: {
    roleId: string;
    roleTitle: string;
    roleSummary?: string;
    skills: string[];
    /** The admin's own prompt. Appended to the built-in one, never replacing it. */
    guidance?: string;
    /**
     * How many scenes to write. A sitting has 5 questions and uses a
     * handful; the pool is larger so the sitting can be chosen from it and two
     * people do not get the same scenes.
     */
    want?: number;
    /**
     * How many workplaces to spread the pool across. Unset lets the model pick
     * two or three from what actually hires for the role.
     */
    teams?: number;
  },
) =>
  // A pool is written in parallel batches of about a minute each, so this
  // runs for minutes. The 10-second read path cut every attempt off and its
  // retry started a second, duplicate generation on the server.
  generateCall<ArcGenerateResult>(token, "/v1/admin/assessment/arc/generate", body, 10 * 60_000);

/** What the backend drafts for the five student questions, plus industries. */
export type RoleContextDraft = {
  entry: string;
  where: string;
  transfers: string;
  changing: string;
  seen: string;
  acrossIndustries: Array<{ industry: string; difference: string }>;
};

export type RoleContextGenerateResult =
  | { ok: true; draft: RoleContextDraft; warnings: string[] }
  | { ok: false; reason: string };

export const adminRoleContextPrompt = (token: string) =>
  apiCall<{ prompt: string }>(token, "/v1/admin/roles/context/prompt");

export const adminGenerateRoleContext = (
  token: string,
  body: {
    roleId: string;
    roleTitle: string;
    sector?: string;
    description?: string;
    responsibilities?: string[];
    skills?: Array<{ name: string; why: string }>;
    workContext?: {
      environment: string;
      hours: string;
      pace: string;
      team: string;
    };
    hardTruths?: string[];
    /**
     * Sources, employer notes and corrections. Unlike the arc's guidance this
     * is authoritative over the model, because three of these fields are
     * claims about the world only a person with a source can settle.
     */
    guidance?: string;
  },
) =>
  generateCall<Extract<RoleContextGenerateResult, { ok: true }>>(
    token,
    "/v1/admin/roles/context/generate",
    body,
  );

/**
 * Practice interview questions for one role. Deliberately NOT a record of
 * what employers ask - no dataset covers that, and what real employers ask is
 * field research. These are rehearsal, drawn from the role's own skills.
 */
export type InterviewQuestion = {
  round: "hr" | "managerial";
  question: string;
  /** Which of the role's skills this rehearses. */
  measures: string;
  /** What a strong answer shows. For the reviewer and the coach, not the student. */
  looksLike: string;
};

export type InterviewQuestionSet = {
  roleId: string;
  roleTitle: string;
  questions: InterviewQuestion[];
};

export type InterviewBank = { sets: InterviewQuestionSet[] };

export type InterviewBankGenerateResult =
  | { ok: true; set: InterviewQuestionSet; warnings: string[] }
  | { ok: false; reason: string };

/**
 * The body of a role, written or enriched from an instruction. Pay, growth
 * and testimonials are deliberately absent: the writer cannot touch them, so
 * whatever is on the role stays.
 */
export type RoleDetailDraft = {
  sector: string;
  pitch: string;
  description: string;
  workMix: Array<{ label: string; share: number; detail: string }>;
  responsibilities: string[];
  skills: Array<{ name: string; why: string }>;
  workContext: {
    environment: string;
    hours: string;
    pace: string;
    team: string;
  };
  hardTruths: string[];
  suitsYouIf: string[];
};

export type RoleDetailGenerateResult =
  | { ok: true; draft: RoleDetailDraft; warnings: string[] }
  | { ok: false; reason: string };

/**
 * A student's own question about a role, answered by the backend from the
 * published material only. `answered: false` is a decline for want of
 * material, not an error - the assistant saying so is the feature.
 */
export type RoleAnswer = {
  answer: string;
  /** Which material it drew on: role, catalogue, assessment, interview, notes. */
  grounded: string[];
  answered: boolean;
};

export const askAboutRole = (token: string, roleId: string, question: string) =>
  generateCall<{ ok: true; result: RoleAnswer }>(token, "/v1/discovery/ask", {
    roleId,
    question,
  });

export const adminRoleDetailPrompt = (token: string) =>
  apiCall<{ prompt: string }>(token, "/v1/admin/roles/detail/prompt");

export const adminGenerateRoleDetail = (
  token: string,
  body: Partial<RoleDetailDraft> & {
    roleId: string;
    roleTitle: string;
    roleSummary?: string;
    /** What you want written or changed. Authoritative over the model. */
    instruction: string;
  },
) =>
  generateCall<Extract<RoleDetailGenerateResult, { ok: true }>>(
    token,
    "/v1/admin/roles/detail/generate",
    body,
  );

/**
 * A drawn scene.
 *
 * Three shapes, not one: a URL when the upload to our bucket worked, raw
 * base64 when the bucket was unavailable and the picture came back inline, or
 * an error. Reading only `url` - which is what this type used to say - meant
 * every successful draw looked like a failure and the count stayed at zero.
 */
export type SceneImage =
  | { id: string; imageUrl: string }
  | { id: string; imageB64: string }
  | { id: string; error: string };

/** The picture as something an <img> can use, whichever shape it came in. */
export function sceneImageSrc(image: SceneImage): string | null {
  if ("imageUrl" in image) return image.imageUrl;
  if ("imageB64" in image) return `data:image/png;base64,${image.imageB64}`;
  return null;
}

/** Which industries genuinely hire for a role. Asked before generating. */
export const adminArcIndustries = (
  token: string,
  body: { roleTitle: string; roleSummary?: string; guidance?: string },
) =>
  apiCall<{ teams: ArcTeam[] }>(token, "/v1/admin/assessment/arc/industries", {
    method: "POST",
    body,
  });

export const adminGenerateArcImages = (
  token: string,
  scenes: Array<{ id: string; scene: string }>,
) =>
  apiCall<{ images: SceneImage[] }>(token, "/v1/admin/assessment/arc/images", {
    method: "POST",
    body: { scenes },
  });

export const adminInterviewPrompt = (token: string) =>
  apiCall<{ prompt: string }>(token, "/v1/admin/interview/questions/prompt");

export const adminGenerateInterviewQuestions = (
  token: string,
  body: {
    roleId: string;
    roleTitle: string;
    sector?: string;
    description?: string;
    responsibilities?: string[];
    skills?: Array<{ name: string; why: string }>;
    workContext?: {
      environment: string;
      hours: string;
      pace: string;
      team: string;
    };
    hardTruths?: string[];
    /** Notes from a real employer conversation, if you have them. */
    guidance?: string;
  },
) =>
  generateCall<Extract<InterviewBankGenerateResult, { ok: true }>>(
    token,
    "/v1/admin/interview/questions/generate",
    body,
  );
