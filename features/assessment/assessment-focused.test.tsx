import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AssessmentIntroduction } from "./assessment-introduction";
import { AssessmentQuestion } from "./assessment-question";

describe("focused readiness", () => {
  const brief = "What is your decision?\n### The situation\nDispatch is delayed.\n### Details to use\nCheck every parcel.";
  it("keeps every context card visible and the question in the answer panel", () => {
    const context = renderToStaticMarkup(createElement(AssessmentQuestion, { brief, part: "context" }));
    const prompt = renderToStaticMarkup(createElement(AssessmentQuestion, { brief, part: "prompt", kind: "spoken" }));
    expect(context).toContain("Dispatch is delayed.");
    expect(context).toContain("Check every parcel.");
    expect(context).not.toContain('class="assessment-clue"');
    expect(context).not.toContain("What is your decision?");
    expect(prompt).toContain("What is your decision?");
    expect(prompt).toContain("Spoken response");
    expect(prompt).not.toContain("Dispatch is delayed.");
  });
  it("retains unstructured legacy briefs in full", () => {
    const context = renderToStaticMarkup(createElement(AssessmentQuestion, { brief: "Read the log. Explain your choice.", part: "context" }));
    expect(context).toContain("Read the log. Explain your choice.");
  });
  it("uses the sitting size and keeps the optional guide out of the start path", () => {
    const html = renderToStaticMarkup(createElement(AssessmentIntroduction, { roleId: "hub_supervisor", roleTitle: "Hub Supervisor", company: "Example Logistics", buddy: "Alex", fullAssessment: true, questions: 8, busy: false, error: null, onStart: () => {} }));
    expect(html).toContain("8 questions");
    expect(html).toContain("Responses autosave");
    expect(html).toContain("Start assessment →");
    expect(html).toContain('<details class="assessment-optional-guide">');
    expect(html).not.toContain('disabled=""');
  });
  it("does not promise autosave to guests", () => {
    const html = renderToStaticMarkup(createElement(AssessmentIntroduction, { roleId: "hub_supervisor", roleTitle: "Hub Supervisor", company: "Example Logistics", buddy: "Alex", fullAssessment: false, questions: 5, busy: false, error: null, onStart: () => {} }));
    expect(html).not.toContain("Responses autosave");
    expect(html).toContain("Sign in to keep your work");
  });
});
