// Learning Studio: the typed calls behind the admin console's Learning Studio
// tab. Mirrors ascend-backend/src/modules/learning-studio.

import { API_URL, GENERATE_TIMEOUT_MS, requestHeaders } from "./core";

export type LearningStepType = "heading" | "text" | "callout" | "image" | "video" | "audio" | "quiz" | "flashcard" | "scenario";
export type LearningOption = { id: string; text: string; correct: boolean; weight: number; feedback: string };
export type LearningQuestion = { id: string; prompt: string; multiple: boolean; explanation: string; options: LearningOption[] };
export type LearningCard = { id: string; front: string; back: string };
export type LearningStoryboard = {
  explanation: string; steps: string[]; workedExample: string; commonMistakes: string[];
  illustration: { title: string; body: string }[];
  scenes: { seconds: number; visual: string; narration: string }[];
};
export type LearningAssistAction = "tailor" | "from_file" | "storyboard";
export type LearningStepContent = { title?: string; body?: string; transcript?: string; cards?: LearningCard[]; questions?: LearningQuestion[]; storyboard?: LearningStoryboard };
export type LearningPending = { kind: LearningAssistAction; promptVersion: string; model: string; source: string; content: LearningStepContent; sourceQuotes: string[] };
export type LearningStep = {
  id: string; type: LearningStepType; title: string;
  purpose: "learn" | "practice" | "challenge" | "apply" | "assessment";
  instructions: string; body: string; assetId?: string; mediaUrl: string; altText: string; transcript: string;
  cards: LearningCard[]; questions: LearningQuestion[]; storyboard?: LearningStoryboard;
  required: boolean; durationSeconds: number; xp: number; passScore: number; skills: string[];
  ai?: { kind: LearningAssistAction; promptVersion: string; model: string; source: string; status: "accepted" | "edited" };
  pending?: LearningPending;
};
export type LearningLevel = "student" | "early_career" | "experienced";
export type LearningLesson = { id: string; title: string; sections: { id: string; title: string; stepIds: string[] }[] };
export type LearningStructureProposal = { title: string; sections: { title: string; blocks: ({ type: "heading" | "text" | "callout" | "quiz" | "flashcard" | "scenario" } & LearningStepContent)[] }[] };
export type StudioJourneyData = { description: string; level: LearningLevel; objectives: string[]; language: string; steps: LearningStep[]; lessons?: LearningLesson[] };
export type LearningAsset = { id: string; kind: "image" | "video" | "audio" | "document"; filename: string; mime: string; bytes: number; url: string | null; readable: boolean };
export type LearningRender = {
  jobId: string; state: "none" | "queued" | "running" | "completed" | "failed" | "outdated"; phase: string; error: string | null;
  provider?: "illustrated" | "openai_stills" | "higgsfield";
  video?: string; captions?: string; poster?: string; durationSeconds?: number;
};
export type StudioJourney = {
  id: string; title: string; roleTitle: string; status: "draft" | "published" | "archived"; revision: number; version: number;
  publishedAt: string | null; updatedAt: string; data: StudioJourneyData;
  assets: LearningAsset[]; renders: Record<string, LearningRender>; issues: string[];
};
export type StudioJourneySummary = { id: string; title: string; roleTitle: string; status: StudioJourney["status"]; version: number; steps: number; updatedAt: string };

export type LearningResult<T> = { ok: true; data: T } | { ok: false; status: number; reason: string };

async function call<T>(token: string, path: string, init: { method?: string; body?: unknown; form?: FormData; timeoutMs?: number } = {}): Promise<LearningResult<T>> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/v1/admin/learning${path}`, {
      method: init.method ?? (init.body === undefined && !init.form ? "GET" : "POST"),
      headers: requestHeaders({ token, json: init.body !== undefined }),
      body: init.form ?? (init.body === undefined ? undefined : JSON.stringify(init.body)),
      signal: AbortSignal.timeout(init.timeoutMs ?? 20_000),
    });
  } catch {
    return { ok: false, status: 0, reason: `Could not reach the server at ${API_URL}. Check your connection and try again.` };
  }
  const json = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok || !json) return { ok: false, status: res.status, reason: json?.error ?? "Something went wrong. Try again." };
  return { ok: true, data: json };
}

export const listLearningJourneys = (token: string) => call<{ journeys: StudioJourneySummary[] }>(token, "/journeys");
export const createLearningJourney = (token: string, input: { title: string; roleTitle: string; level: LearningLevel }) =>
  call<{ id: string }>(token, "/journeys", { body: input });
export const getLearningJourney = (token: string, id: string) => call<StudioJourney>(token, `/journeys/${id}`);
export const saveLearningJourney = (token: string, id: string, input: { revision: number; title: string; roleTitle: string; data: StudioJourneyData }) =>
  call<StudioJourney>(token, `/journeys/${id}`, { method: "PUT", body: input });
export const publishLearningJourney = (token: string, id: string, revision: number) =>
  call<StudioJourney>(token, `/journeys/${id}/publish`, { body: { revision } });
export function uploadLearningAsset(token: string, id: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  return call<LearningAsset>(token, `/journeys/${id}/assets`, { form, timeoutMs: 180_000 });
}
export const assistLearningStep = (token: string, id: string, input: { action: LearningAssistAction; step: LearningStep; assetId?: string; request: string }) =>
  call<{ draft: LearningPending }>(token, `/journeys/${id}/assist`, { body: input, timeoutMs: GENERATE_TIMEOUT_MS });
export const assistLearningStructure = (token: string, id: string, input: { scope: "lesson" | "subsection"; lessonTitle?: string; sectionTitle?: string; request: string }) =>
  call<{ proposal: LearningStructureProposal }>(token, `/journeys/${id}/assist-structure`, { body: input, timeoutMs: GENERATE_TIMEOUT_MS });
export const renderLearningVideo = (token: string, id: string, stepId: string, provider: "illustrated" | "openai_stills" | "higgsfield") =>
  call<LearningRender>(token, `/journeys/${id}/steps/${encodeURIComponent(stepId)}/render`, { body: { provider } });
