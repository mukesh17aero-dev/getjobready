// Typed calls for the admin assessment bank: the role assessment questions,
// their generation, and their illustrative images. Self-contained on purpose —
// it reuses only the URL and header helpers from lib/api.ts and adds nothing
// there. Draft save and publish go through the generic content-kind helpers
// (adminSaveDraft / adminPublish) with the "assessment_bank" kind.

import { API_URL, requestHeaders, type ContentDoc } from "@/lib/api";

export const ASSESSMENT_KIND = "assessment_bank";

export type AssessmentOption = { id: string; label: string; feedback: string };

export type AssessmentQuestion = {
  id: string;
  roleId: string;
  skillId: string;
  // 1 probes the basics, 2 the normal messiness of a shift, 3 the hard calls.
  proficiencyLevel: 1 | 2 | 3;
  situation: string;
  prompt: string;
  options: AssessmentOption[];
  correctOptionId: string;
  rationale: string;
  // Set only by the explicit image buttons; imageB64 is the storage fallback.
  imageUrl?: string;
  imageB64?: string;
};

export type AssessmentBank = { questions: AssessmentQuestion[] };

// The stored document, fetched client-side because the console loads this tab
// lazily. Uses the same generic content endpoint every other kind uses.
export async function adminAssessmentContent(
  token: string,
): Promise<{ published: ContentDoc | null; draft: ContentDoc | null } | null> {
  try {
    const res = await fetch(`${API_URL}/v1/admin/content/${ASSESSMENT_KIND}`, {
      cache: "no-store",
      headers: requestHeaders({ token }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      published: ContentDoc | null;
      draft: ContentDoc | null;
    };
    return { published: data.published, draft: data.draft };
  } catch {
    return null;
  }
}

// Failures carry the server's own explanation — an admin staring at "could
// not generate" needs the why. Mirrors adminGenerateQuestions.
export async function adminGenerateAssessmentQuestions(
  token: string,
  body: {
    role: { id: string; title: string; summary?: string };
    skills: Array<{ id: string; name: string; description?: string; need: 1 | 2 | 3 }>;
    wanted: Array<{ skillId: string; count: number }>;
    existing?: Array<{ skillId: string; text: string }>;
    guidance?: string;
  },
): Promise<
  { questions: AssessmentQuestion[]; usedStub: boolean } | { error: string }
> {
  try {
    const res = await fetch(`${API_URL}/v1/admin/assessment/questions/generate`, {
      method: "POST",
      cache: "no-store",
      headers: requestHeaders({ token, json: true }),
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as
      | { questions?: AssessmentQuestion[]; usedStub?: boolean; error?: string }
      | null;
    if (!res.ok || !data?.questions) {
      return { error: data?.error ?? `the server said ${res.status}` };
    }
    return { questions: data.questions, usedStub: data.usedStub ?? false };
  } catch {
    return { error: "the request never reached the server" };
  }
}

export type AssessmentImageResult =
  | { id: string; imageUrl: string }
  | { id: string; imageB64: string }
  | { id: string; error: string };

// One small request per call (the API caps it at 4); the editor loops over a
// batch itself so the admin sees progress and can stop.
export async function adminGenerateAssessmentImages(
  token: string,
  questions: Array<{ id: string; scene: string }>,
): Promise<{ images: AssessmentImageResult[] } | { error: string }> {
  try {
    const res = await fetch(`${API_URL}/v1/admin/assessment/images`, {
      method: "POST",
      cache: "no-store",
      headers: requestHeaders({ token, json: true }),
      body: JSON.stringify({ questions }),
    });
    const data = (await res.json().catch(() => null)) as
      | { images?: AssessmentImageResult[]; error?: string }
      | null;
    if (!res.ok || !data?.images) {
      return { error: data?.error ?? `the server said ${res.status}` };
    }
    return { images: data.images };
  } catch {
    return { error: "the request never reached the server" };
  }
}
