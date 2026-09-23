// Admin console (content module).
//
// Part of the typed contract with the Ascend API. One file per backend
// module; lib/api/index.ts is the barrel every caller imports.

// ---- Admin console (content module) ----

import { API_URL, requestHeaders } from "./core";
import { apiCall } from "./core";
export type ContentDoc = {
  kind: string;
  version: number;
  status: "draft" | "published";
  data: Record<string, unknown>;
  note: string | null;
  updatedAt: string;
  publishedAt: string | null;
};

export type AdminContent = {
  kind: string;
  published: ContentDoc | null;
  draft: ContentDoc | null;
  builtIn: Record<string, unknown>;
  versions: Array<{
    version: number;
    publishedAt: string | null;
    note: string | null;
  }>;
};

export const adminAccess = (token: string) =>
  apiCall<{ isAdmin: boolean; openToEveryone: boolean; aiConfigured: boolean }>(
    token,
    "/v1/admin/access",
  );

export const adminContent = (token: string, kind: string) =>
  apiCall<AdminContent>(token, `/v1/admin/content/${kind}`);

/**
 * Why a draft would not save.
 *
 * apiCall collapses every failure to null, so a rejected save looked identical
 * to a network blip and the console could only say "could not save the draft".
 * The commonest cause is size - a sixty-scene pool is megabytes - and that has
 * a specific fix the admin can act on, so it is worth naming.
 */
export async function adminSaveDraftDetailed(
  token: string,
  kind: string,
  data: unknown,
  note?: string,
): Promise<{ ok: true; doc: ContentDoc } | { ok: false; reason: string }> {
  let res: Response;
  const body = JSON.stringify({ data, note });
  try {
    res = await fetch(`${API_URL}/v1/admin/content/${kind}/draft`, {
      method: "PUT",
      cache: "no-store",
      headers: requestHeaders({ token, json: true }),
      body,
    });
  } catch {
    return { ok: false, reason: `Could not reach the server at ${API_URL}.` };
  }
  if (res.ok) return { ok: true, doc: (await res.json()) as ContentDoc };

  const said = await res
    .json()
    .then((d: { error?: string }) => d?.error ?? "")
    .catch(() => "");
  const mb = (body.length / (1024 * 1024)).toFixed(1);
  const reason =
    res.status === 413
      ? `The draft is ${mb} MB, which the server refused. Restart the backend if you have not since the limit was raised, or write fewer scenes.`
      : res.status === 401 || res.status === 403
        ? "Your session expired, or this account is not an admin."
        : said || `The server answered ${res.status}.`;
  return { ok: false, reason };
}

export const adminSaveDraft = (
  token: string,
  kind: string,
  data: unknown,
  note?: string,
) =>
  apiCall<ContentDoc>(token, `/v1/admin/content/${kind}/draft`, {
    method: "PUT",
    body: { data, note },
  });

export const adminPublish = (token: string, kind: string) =>
  apiCall<ContentDoc>(token, `/v1/admin/content/${kind}/publish`, {
    method: "POST",
    body: {},
  });

export const adminDiscardDraft = (token: string, kind: string) =>
  apiCall<{ discarded: boolean }>(token, `/v1/admin/content/${kind}/draft`, {
    method: "DELETE",
  });

export type Skill = { id: string; name: string; description: string };
export type SkillModel = {
  skills: Skill[];
  traitSkill: Record<string, Record<string, number>>;
  skillRole: Record<string, Record<string, number>>;
  signalSkill: Record<string, Record<string, number>>;
  signalInfluence: 0 | 1 | 2;
};

export type SkillModelReview = {
  signals: Array<{
    id: string;
    label: string;
    meaning: string;
    source: "discovery" | "product";
    usedInScoring: boolean;
  }>;
  reviews: Array<{
    level: "problem" | "caution";
    scope: "skill" | "role" | "signal";
    message: string;
  }>;
  impact: {
    meaningful: boolean;
    runs: number;
    topRoleAgreement: number;
    decisiveRuns: number;
    decisiveAgreement: number;
    shifts: Array<{ from: string; to: string; runs: number }>;
  };
};

export type SkillSuggestion = {
  roleId: string;
  skills: Array<{ skillId: string; level: 1 | 2 | 3 }>;
  proposedNewSkills: Array<{ name: string; description: string }>;
};

export const adminSuggestSkills = (
  token: string,
  body: {
    roles: Array<{
      id: string;
      title: string;
      sector?: string;
      summary?: string;
    }>;
    catalogue: Array<{ id: string; name: string; description: string }>;
    examples?: Array<{
      title: string;
      skills: Array<{ skillId: string; level: 1 | 2 | 3 }>;
    }>;
  },
) =>
  apiCall<{ suggestions: SkillSuggestion[]; usedStub: boolean }>(
    token,
    "/v1/admin/skills/suggest",
    { method: "POST", body },
  );

export type SkillWeight = { skillId: string; level: 1 | 2 | 3 };

// Three shapes, per the Blueprint: paired work choices, micro-scenarios and one
// optional open question per skill.
/** The scene a question is set in, drawn. Stored on the question itself. */
export type QuestionPicture = { url: string; alt: string };

export type GeneratedQuestion =
  | {
      kind: "choice";
      id: string;
      forSkillId: string;
      prompt: string;
      picture?: QuestionPicture;
      a: { label: string; weights: SkillWeight[] };
      b: { label: string; weights: SkillWeight[] };
    }
  | {
      kind: "scenario";
      id: string;
      forSkillId: string;
      situation: string;
      picture?: QuestionPicture;
      options: Array<{ id: string; label: string; weights: SkillWeight[] }>;
    }
  | { kind: "explanation"; id: string; forSkillId: string; prompt: string };

export const adminReviewSkillModel = (token: string, model: SkillModel) =>
  apiCall<SkillModelReview>(token, "/v1/admin/skill-model/review", {
    method: "POST",
    body: { model },
  });
