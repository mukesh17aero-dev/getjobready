// Typed calls for the AI Interview practice endpoints. Self-contained on
// purpose: everything the interview screens need from the backend lives
// here, so the shared client stays untouched.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export type InterviewRound = "hr" | "managerial";
export type InterviewStage = "icebreaker" | "introduction" | "assessment" | "close";

export type InterviewTurnView = {
  index: number;
  stage: InterviewStage;
  question: string;
  answer: string | null;
  /** The interviewer's final words, present on the answered close turn. */
  closing?: string | null;
};

export type InterviewSessionView = {
  id: string;
  /** The interviewer's name, so the room can say who is speaking. */
  interviewer?: string;
  roleTitle: string;
  round: InterviewRound;
  status: "in_progress" | "completed";
  startedAt: string;
  secondsLeft: number;
  totalSeconds: number;
  questionCap: number;
  /** True once the wrap-up question has been answered — time to finish. */
  done: boolean;
  turns: InterviewTurnView[];
};

export type GrowthArea = { skill: string; note: string };

export type InterviewSummaryView = {
  wentWell: string[];
  toImprove: string[];
  focusNext: string;
  perQuestion: Array<{
    /** Which transcript turn this is about; the read-out shows that
        question as it was actually asked. -1 when unknown. */
    index?: number;
    question: string;
    strength: string;
    improvement: string;
  }>;
  growthAreas: GrowthArea[];
  progressNote: string | null;
};

export type InterviewHome = {
  selectedRole: { id: string; title: string } | null;
  profileHints: { firstName: string | null; hasTrack: boolean; hasSkills: boolean };
  speechAvailable: boolean;
  session: InterviewSessionView | null;
  pastCount: number;
  lastSummary: InterviewSummaryView | null;
  /** Growth areas from earlier interviews — what the interviewer will check on. */
  workingOn: GrowthArea[];
  /** Completed interviews, newest first, each with its full read-out. */
  history: Array<{
    roleTitle: string;
    round: "hr" | "managerial";
    completedAt: string;
    summary: InterviewSummaryView;
    turns: InterviewTurnView[];
  }>;
};

function headers(token: string, json = false): Record<string, string> {
  const h: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "X-Request-Id": crypto.randomUUID(),
  };
  if (json) h["Content-Type"] = "application/json";
  return h;
}

async function call<T>(
  token: string,
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: init?.method ?? "GET",
      cache: "no-store",
      headers: headers(token, init?.body !== undefined),
      ...(init?.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const getInterviewHome = (token: string) =>
  call<InterviewHome>(token, "/v1/interview");

export const startInterview = (
  token: string,
  body: {
    roleId?: string;
    roleTitle: string;
    jd?: string;
    /** What they asked to be pushed on, in their own words. */
    focus?: string;
    /** Who takes it - the round sets the default, the person may change it. */
    interviewer?: "asha" | "ravi";
    round: InterviewRound;
  },
) => call<InterviewSessionView>(token, "/v1/interview/sessions", { method: "POST", body });

export const requestNextTurn = (token: string) =>
  call<InterviewSessionView>(token, "/v1/interview/sessions/current/turn", {
    method: "POST",
    body: {},
  });

export const answerWithText = async (
  token: string,
  text: string,
): Promise<
  | { ok: true; transcript: string; session: InterviewSessionView }
  | { ok: false; error: string; session?: InterviewSessionView; finished?: boolean }
> => {
  try {
    const res = await fetch(`${API_URL}/v1/interview/sessions/current/answer`, {
      method: "POST",
      cache: "no-store",
      headers: headers(token, true),
      body: JSON.stringify({ text }),
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return {
        ok: false,
        error: String(body.error ?? "That answer did not go through. Try again."),
        ...(body.session ? { session: body.session as InterviewSessionView } : {}),
        // The interview was already wrapped up when this landed.
        ...(body.finished === true ? { finished: true } : {}),
      };
    }
    const data = body as unknown as { transcript: string; session: InterviewSessionView };
    return { ok: true, transcript: data.transcript, session: data.session };
  } catch {
    return { ok: false, error: "Could not reach the server. Try again in a moment." };
  }
};

// Voice answers go up as multipart so the server can transcribe them. A
// failure returns the server's own explanation — the screen offers typing.
export async function answerWithAudio(
  token: string,
  audio: Blob,
  filename: string,
): Promise<
  | { ok: true; transcript: string; session: InterviewSessionView }
  | { ok: false; error: string; session?: InterviewSessionView; finished?: boolean }
> {
  try {
    const form = new FormData();
    form.append("file", audio, filename);
    const res = await fetch(`${API_URL}/v1/interview/sessions/current/answer`, {
      method: "POST",
      headers: headers(token),
      body: form,
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return {
        ok: false,
        error: String(body.error ?? "That recording did not go through. Try typing instead."),
        // Present when the server is telling us our view is behind.
        ...(body.session ? { session: body.session as InterviewSessionView } : {}),
        ...(body.finished === true ? { finished: true } : {}),
      };
    }
    const data = body as unknown as { transcript: string; session: InterviewSessionView };
    return { ok: true, transcript: data.transcript, session: data.session };
  } catch {
    return { ok: false, error: "Could not reach the server. Try typing your answer." };
  }
}

/** The question read aloud, as a playable object URL. Null when speech is off. */
export async function fetchQuestionAudio(
  token: string,
  turnIndex: number,
): Promise<string | null> {
  try {
    const res = await fetch(
      `${API_URL}/v1/interview/sessions/current/speech/${turnIndex}`,
      { headers: headers(token), cache: "no-store" },
    );
    if (!res.ok) return null;
    return URL.createObjectURL(await res.blob());
  } catch {
    return null;
  }
}

export async function finishInterview(
  token: string,
): Promise<{ summary: InterviewSummaryView } | { error: string }> {
  try {
    const res = await fetch(`${API_URL}/v1/interview/sessions/current/finish`, {
      method: "POST",
      headers: headers(token, true),
      body: JSON.stringify({}),
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok || !body.summary) {
      return {
        error: String(
          body.error ?? "We could not write your read-out just now. Try again in a moment.",
        ),
      };
    }
    return { summary: body.summary as InterviewSummaryView };
  } catch {
    return { error: "Could not reach the server. Your interview is saved - try again." };
  }
}
