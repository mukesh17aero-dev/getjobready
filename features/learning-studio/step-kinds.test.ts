import { describe, expect, it } from "vitest";
import type { LearningStep } from "@/lib/api";
import { acceptDraft, blankStep, moveItem, rejectDraft, touched } from "./step-kinds";

const withDraft = (): LearningStep => ({
  ...blankStep("text"),
  title: "Old title",
  body: "Old body",
  pending: { kind: "tailor", promptVersion: "v1", model: "m", source: "the step's own text", content: { title: "New title", body: "New body" }, sourceQuotes: [] },
});

describe("AI drafts on a step", () => {
  it("changes nothing until accepted, then applies the draft and records where it came from", () => {
    const step = withDraft();
    expect(step.body).toBe("Old body");
    const accepted = acceptDraft(step);
    expect(accepted.body).toBe("New body");
    expect(accepted.title).toBe("New title");
    expect(accepted.pending).toBeUndefined();
    expect(accepted.ai).toMatchObject({ kind: "tailor", status: "accepted" });
  });

  it("throws a rejected draft away and keeps what was there", () => {
    const rejected = rejectDraft(withDraft());
    expect(rejected.pending).toBeUndefined();
    expect(rejected.body).toBe("Old body");
    expect(rejected.ai).toBeUndefined();
  });

  it("marks accepted AI content as edited once a person changes it", () => {
    expect(touched(acceptDraft(withDraft())).ai?.status).toBe("edited");
    expect(touched(blankStep("text")).ai).toBeUndefined();
  });

  it("sets a video step's length from an accepted storyboard", () => {
    const step: LearningStep = { ...blankStep("video"), pending: { kind: "storyboard", promptVersion: "v1", model: "m", source: "s", sourceQuotes: [], content: { storyboard: {
      explanation: "e", steps: ["a", "b"], workedExample: "w", commonMistakes: ["m"], illustration: [{ title: "t", body: "b" }, { title: "t", body: "b" }],
      scenes: [{ seconds: 20, visual: "v", narration: "n" }, { seconds: 20, visual: "v", narration: "n" }, { seconds: 25, visual: "v", narration: "n" }],
    } } } };
    expect(acceptDraft(step).durationSeconds).toBe(65);
  });
});

describe("blank steps and reordering", () => {
  it("starts a quiz with one question and a marked correct answer, and a scenario with a best choice", () => {
    expect(blankStep("quiz").questions[0]!.options.filter((o) => o.correct)).toHaveLength(1);
    expect(blankStep("scenario").questions[0]!.options.filter((o) => o.weight === 100)).toHaveLength(1);
  });

  it("moves a step to a new position, in both directions", () => {
    expect(moveItem(["a", "b", "c", "d"], 0, 3)).toEqual(["b", "c", "a", "d"]);
    expect(moveItem(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"]);
    expect(moveItem(["a", "b", "c"], 1, 1)).toEqual(["a", "b", "c"]);
  });
});
