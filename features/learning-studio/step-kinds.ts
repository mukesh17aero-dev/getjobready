// The step types an admin can drag into a journey, what each is for, and how
// an accepted AI draft is folded into a step.

import type { LearningPending, LearningStep, LearningStepType } from "@/lib/api";

export const STEP_KINDS: { type: LearningStepType; label: string; hint: string; glyph: string }[] = [
  { type: "heading", label: "Heading", hint: "Introduce a topic", glyph: "H" },
  { type: "text", label: "Text", hint: "Write an explanation", glyph: "¶" },
  { type: "callout", label: "Key point", hint: "Make one idea stand out", glyph: "✦" },
  { type: "image", label: "Image", hint: "Picture with a caption", glyph: "▣" },
  { type: "video", label: "Video", hint: "Upload, link or make with AI", glyph: "▶" },
  { type: "audio", label: "Audio", hint: "Listen with transcript", glyph: "♪" },
  { type: "quiz", label: "Quiz", hint: "Check understanding", glyph: "?" },
  { type: "flashcard", label: "Flashcards", hint: "Flip to remember", glyph: "⧉" },
  { type: "scenario", label: "Scenario", hint: "Make a workplace decision", glyph: "⑂" },
];

export const kindOf = (type: LearningStepType) => STEP_KINDS.find((k) => k.type === type)!;

const id = () => crypto.randomUUID();
const option = (over: Partial<LearningStep["questions"][number]["options"][number]> = {}) => ({ id: id(), text: "", correct: false, weight: 0, feedback: "", ...over });

export function blankStep(type: LearningStepType): LearningStep {
  const xp = type === "quiz" ? 20 : type === "scenario" ? 30 : 10;
  return {
    id: id(), type, title: "", purpose: type === "quiz" || type === "scenario" ? "practice" : "learn",
    instructions: "", body: "", mediaUrl: "", altText: "", transcript: "",
    cards: type === "flashcard" ? [{ id: id(), front: "", back: "" }] : [],
    questions: type === "quiz" || type === "scenario"
      ? [{ id: id(), prompt: "", multiple: false, explanation: "", options: type === "scenario" ? [option({ weight: 100 }), option()] : [option({ correct: true }), option()] }]
      : [],
    required: type !== "heading" && type !== "callout", durationSeconds: type === "video" ? 120 : 60, xp: type === "heading" || type === "callout" ? 0 : xp, passScore: 70, skills: [],
  };
}

export const newOption = option;
export const newQuestion = (scenario: boolean) => ({ id: id(), prompt: "", multiple: false, explanation: "", options: [option(scenario ? { weight: 100 } : { correct: true }), option()] });
export const newCard = () => ({ id: id(), front: "", back: "" });

function withoutPending(step: LearningStep): LearningStep {
  const rest = { ...step };
  delete rest.pending;
  return rest;
}

/** The step with an AI draft applied, recording where the content came from. */
export function acceptDraft(step: LearningStep): LearningStep {
  const pending: LearningPending | undefined = step.pending;
  if (!pending) return step;
  const c = pending.content;
  return {
    ...withoutPending(step),
    ...(c.title ? { title: c.title } : {}),
    ...(c.body !== undefined ? { body: c.body } : {}),
    ...(c.transcript !== undefined ? { transcript: c.transcript } : {}),
    ...(c.cards ? { cards: c.cards } : {}),
    ...(c.questions ? { questions: c.questions } : {}),
    ...(c.storyboard ? { storyboard: c.storyboard, durationSeconds: Math.max(30, Math.min(600, c.storyboard.scenes.reduce((n, s) => n + s.seconds, 0))) } : {}),
    ai: { kind: pending.kind, promptVersion: pending.promptVersion, model: pending.model, source: pending.source, status: "accepted" },
  };
}

export const rejectDraft = withoutPending;

/** Any hand edit after accepting AI content marks it as edited, so the record stays truthful (spec AI-004). */
export const touched = (step: LearningStep): LearningStep => (step.ai?.status === "accepted" ? { ...step, ai: { ...step.ai, status: "edited" } } : step);

/** Move one item to a new index, as drag and drop and the arrow buttons both need. */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || from >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(to > from ? to - 1 : to, next.length)), 0, item!);
  return next;
}
