import { describe, expect, it } from "vitest";
import { emptyInteraction, interactionComplete, interactionText } from "../../lib/assessment-presentation";
import type { SceneInteraction } from "../../lib/api";

const routing: SceneInteraction = { kind: "routing", messageLabel: "Your message", choices: [{ id: "dispatch", label: "Dispatch team" }, { id: "customer", label: "Customer" }] };
const priority: SceneInteraction = { kind: "prioritisation", reasonLabel: "Why?", items: [{ id: "delivery", label: "Confirm delivery" }, { id: "address", label: "Check address" }] };

describe("assessment response presentation", () => {
  it("does not treat an initial choice or default order as complete work", () => {
    expect(interactionComplete(routing, emptyInteraction(routing))).toBe(false);
    expect(interactionComplete(priority, emptyInteraction(priority))).toBe(false);
  });
  it("requires a known recipient and the student's own message", () => {
    expect(interactionComplete(routing, { kind: "routing", choiceId: "unknown", message: "Check the ETA" })).toBe(false);
    expect(interactionComplete(routing, { kind: "routing", choiceId: "dispatch", message: "Check the ETA" })).toBe(true);
  });
  it("rejects incomplete or duplicate priority lists", () => {
    expect(interactionComplete(priority, { kind: "prioritisation", orderedIds: ["delivery", "delivery"], reason: "Deadline first" })).toBe(false);
    expect(interactionComplete(priority, { kind: "prioritisation", orderedIds: ["address"], reason: "Deadline first" })).toBe(false);
  });
  it("preserves the actual selected order and reasoning in readable evidence", () => {
    expect(interactionText(priority, { kind: "prioritisation", orderedIds: ["address", "delivery"], reason: "The address cutoff is earlier" })).toBe("1. Check address\n2. Confirm delivery\nReason: The address cutoff is earlier");
  });
  it("requires mandatory handover fields and leaves optional ones optional", () => {
    const config: SceneInteraction = { kind: "handover", fields: [{ id: "owner", label: "Next owner" }, { id: "note", label: "Note", required: false }] };
    expect(interactionComplete(config, { kind: "handover", values: {} })).toBe(false);
    expect(interactionComplete(config, { kind: "handover", values: { owner: "Dispatch" } })).toBe(true);
  });
});

describe("question card presentation", () => {
  it("separates the prompt from context without interpreting the facts", async () => {
    const { assessmentQuestionCards } = await import("../../lib/assessment-presentation");
    expect(assessmentQuestionCards("What would you do?\n\n### Message\nDelivery is late.\n\n### Policy\nDo not promise an unconfirmed date.")).toEqual({ question: "What would you do?", cards: [{ title: "Message", body: "Delivery is late." }, { title: "Policy", body: "Do not promise an unconfirmed date." }] });
  });
  it("keeps all legacy paragraphs and makes repeated conversion idempotent", async () => {
    const { formatAssessmentQuestion, assessmentQuestionCards } = await import("../../lib/assessment-presentation");
    const text = "The customer paid ₹450.\n\nThe refund policy is 14 days.\n\nWrite what you would say.";
    const updated = formatAssessmentQuestion(text);
    expect(formatAssessmentQuestion(updated)).toBe(updated);
    expect(assessmentQuestionCards(updated).cards.map(card => card.body).join("\n\n")).toBe(text);
  });
  it("removes live-helper offers while preserving a supplied AI draft and the checking task", async () => {
    const { formatAssessmentQuestion } = await import("../../lib/assessment-presentation");
    const updated = formatAssessmentQuestion("You can ask Priya for help. The AI assistant is available.\n\nThe assistant draft says ₹450. The policy says ₹400. Check the numbers and write your own reply.");
    expect(updated).not.toContain("can ask Priya");
    expect(updated).not.toContain("assistant is available");
    expect(updated).toContain("The assistant draft says ₹450. The policy says ₹400. Check the numbers and write your own reply.");
  });
  it("updates dependent authoring instructions without changing identities or skill mappings", async () => {
    const { formatAssessmentScene } = await import("../../lib/assessment-presentation");
    const revised = formatAssessmentScene({ id: "q", title: "Check the reply", day: "1", minutes: 2, answer: "artefact", support: "buddy", brief: "Find them, fix the draft, and paste the corrected version as your answer.", fields: ["Paste your corrected email here."], measures: ["Clear communication"], criteria: ["Uses the AI assistant to help with drafting but applies their own judgement to the interpretation"] });
    expect(revised.id).toBe("q");
    expect(revised.measures).toEqual(["Clear communication"]);
    expect(revised.support).toBe("assistant");
    expect(revised.brief).toContain("type the corrected version");
    expect(revised.fields).toEqual(["Type your corrected email here."]);
    expect(revised.criteria?.[0]).toContain("their own judgement");
    expect(formatAssessmentScene(revised)).toEqual(revised);
  });
});
