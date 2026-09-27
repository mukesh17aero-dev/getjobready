import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WorkplaceOrientation, type CourseIntroduction } from "@/features/simulation";

const introduction: Omit<CourseIntroduction, "video"> = {
  title: "Inside a support team",
  objective: "Understand how a customer request reaches a resolution.",
  responsibilities: ["Read the customer record before responding."],
  recruiterExpectations: ["Explain the next step clearly."],
  lesson: {
    explanation: "The support team connects customers with the people who can resolve their request.",
    steps: ["Read the request", "Check the record", "Explain the next step"],
    workedExample: "An agent checks a delayed delivery before replying to the customer.",
    commonMistakes: ["Promising a delivery date without checking the record."],
    illustration: [
      { title: "Customer inbox", body: "Requests arrive here." },
      { title: "Operations team", body: "This team confirms delivery details." },
    ],
  },
};
const render = (intro = introduction) => renderToStaticMarkup(createElement(WorkplaceOrientation, {
  roleTitle: "Customer Support Executive", sector: "Customer services", introduction: intro,
  onContinue: () => {}, onSkip: () => {},
}));

describe("workplace orientation", () => {
  it("opens on role context before asking for an answer or a schedule", () => {
    const html = render();
    expect(html).toContain("Customer Support Executive");
    expect(html).toContain(introduction.objective);
    expect(html).toContain("Your workplace");
    expect(html).not.toContain("<textarea");
    expect(html).not.toContain('type="date"');
  });
  it("builds the visual context from the published role material", () => {
    const html = render();
    expect(html).toContain("Customer inbox");
    expect(html).toContain("Operations team");
    expect(html).toContain("Requests arrive here.");
    expect(html).toContain(introduction.lesson.explanation);
    expect(html).toContain('aria-controls="workplace-scene"');
  });
  it("keeps narration optional and does not load third-party media on entry", () => {
    const html = render();
    expect(html).toContain("Listen to this chapter");
    expect(html).toContain("Optional device voice");
    expect(html).toContain("I know the role");
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("autoplay");
  });
  it("supports a published introduction without visual cards", () => {
    const html = render({ ...introduction, lesson: { ...introduction.lesson, illustration: [] } });
    expect(html).toContain(introduction.objective);
    expect(html).toContain("Follow the work");
    expect(html).not.toContain('id="workplace-scene"');
  });
});
