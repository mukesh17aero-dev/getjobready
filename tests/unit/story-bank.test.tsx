import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StoryBank } from "@/features/story-bank";
import type { StoryBank as Bank, Story } from "@/lib/api";

// This is a "use client" component with real interaction (tabs, a drafting
// dialog) that this project's test setup cannot drive - there is no jsdom or
// React Testing Library here, only server-side static rendering. So this
// file covers what that honestly can: the initial render for each bank
// shape, and the strength/chip logic a candidate would actually read.
// Tab-switching, drafting and saving are not covered here.

const story = (over: Partial<Story> = {}): Story => ({
  id: "s1",
  title: "The refund I could not give",
  competency: "Handling conflict",
  star: { situation: "a", task: "b", action: "c", result: "d" },
  evidence: { kind: "told", label: "Said in practice", proof: false },
  roles: [],
  answers: [],
  spokenAt: null,
  updatedAt: "2026-09-01T00:00:00Z",
  ...over,
});

const bank = (over: Partial<Bank> = {}): Bank => ({
  stories: [],
  competencies: ["Handling conflict", "Working under pressure"],
  coverage: [
    { competency: "Handling conflict", best: null, storyIds: [], questions: 3 },
    { competency: "Working under pressure", best: null, storyIds: [], questions: 2 },
  ],
  questions: [],
  roleId: null,
  ...over,
});

const render = (b: Bank, signedOut = false) =>
  renderToStaticMarkup(createElement(StoryBank, { initial: b, signedOut }));

describe("Story Bank initial render", () => {
  it("shows the empty-bank message rather than a blank grid", () => {
    const html = render(bank());
    expect(html).toContain("Nothing here yet, and that is the normal starting point");
    expect(html).toContain("My stories (0)");
    expect(html).toContain("0 of 2");
  });

  it("labels a never-spoken story as not yet said, not as a finished story", () => {
    const html = render(bank({ stories: [story()] }));
    expect(html).toContain("Not said yet");
    expect(html).toContain("I have said this out loud");
    expect(html).not.toContain("Proven");
  });

  it("labels a spoken, unproven story distinctly from a spoken, proven one", () => {
    const usable = story({ id: "usable", spokenAt: "2026-09-02T00:00:00Z", evidence: { kind: "told", label: "Said in practice", proof: false } });
    const proven = story({ id: "proven", spokenAt: "2026-09-02T00:00:00Z", evidence: { kind: "simulation", label: "Escalation call simulation", proof: true } });
    const html = render(bank({ stories: [usable, proven] }));
    expect(html).toContain("Yours, unproven");
    expect(html).toContain("Proven");
    // Once spoken, the "say it out loud" prompt no longer applies.
    expect(html).not.toContain("I have said this out loud");
  });

  it("names a blank STAR part rather than filling it in", () => {
    const incomplete = story({ star: { situation: "a", task: "b", action: "", result: "" } });
    const html = render(bank({ stories: [incomplete] }));
    expect(html).toContain("Left blank");
    expect(html).toContain("nothing in your record said what this was");
  });

  it("marks the signed-out example bank as an example, not a real record", () => {
    const html = render(bank({ stories: [story()] }), true);
    expect(html).toContain("These three stories are an example, not yours");
  });

  it("does not show the signed-out example banner for a real, signed-in bank", () => {
    const html = render(bank({ stories: [story()] }), false);
    expect(html).not.toContain("an example, not yours");
  });

  it("counts covered competencies from coverage, not from the story list length", () => {
    const html = render(
      bank({
        stories: [story(), story({ id: "s2", competency: "Working under pressure" })],
        coverage: [
          { competency: "Handling conflict", best: "draft", storyIds: ["s1"], questions: 3 },
          { competency: "Working under pressure", best: "draft", storyIds: ["s2"], questions: 2 },
        ],
      }),
    );
    expect(html).toContain("2 of 2");
  });
});
