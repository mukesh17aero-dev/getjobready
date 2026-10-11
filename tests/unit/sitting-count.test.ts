import { describe, expect, it } from "vitest";
import { countOf, situationsAttempted } from "@/features/assessment";

describe("sitting counts come from data, never from a typed number", () => {
  it("reads a sitting against its own recorded size", () => {
    expect(situationsAttempted(4, 5)).toBe("4 of 5 situations attempted");
    // A sitting taken when the size was 12 is still read as 12.
    expect(situationsAttempted(9, 12)).toBe("9 of 12 situations attempted");
  });

  it("leaves out a total that was never recorded rather than guessing one", () => {
    expect(situationsAttempted(7, null)).toBe("7 situations attempted");
    expect(situationsAttempted(1, null)).toBe("1 situation attempted");
  });

  it("pluralises the total, not the attempted count", () => {
    expect(situationsAttempted(0, 1)).toBe("0 of 1 situation attempted");
  });

  it("counts reassessment questions from the task list", () => {
    expect(countOf(3, "fresh question")).toBe("3 fresh questions");
    expect(countOf(1, "fresh question")).toBe("1 fresh question");
  });
});

describe("no screen hard-codes a sitting size", async () => {
  const { readFileSync } = await import("node:fs");
  const files = [
    "app/(student)/practice/page.tsx",
    "app/(student)/practice/missions/simulation-workspace.tsx",
  ];
  it.each(files)("%s states no literal question count", (file) => {
    const src = readFileSync(file, "utf8");
    expect(src).not.toMatch(/\b(of 10 situations|twelve fresh questions|11 questions)\b/i);
  });
});

describe("practice hub status chips share one vocabulary", async () => {
  const { readFileSync } = await import("node:fs");
  it("never calls a live tool under development or a preview", () => {
    const src = readFileSync("app/(student)/practice/page.tsx", "utf8");
    expect(src).not.toMatch(/"Under development"|"Preview available"/);
  });
});

describe("the readiness start screen describes the sitting it will open", async () => {
  const { sittingLine } = await import("@/app/(student)/practice/readiness/start-screen");
  it("promises a new sitting's own size", () => {
    expect(sittingLine({ sittingSize: 5, inProgress: null })).toBe("Try 5 workplace questions with no time limit.");
  });
  it("describes an older sitting under way at its own size, not five", () => {
    expect(sittingLine({ sittingSize: 8, inProgress: { answered: 6 } })).toBe("You have a sitting under way: 6 of 8 questions answered, with no time limit.");
  });
  it("names no number when it does not know one", () => {
    expect(sittingLine({})).toBe("Try a few workplace questions with no time limit.");
  });
});

describe("no screen promises a fixed number of questions", async () => {
  const { readFileSync } = await import("node:fs");
  it.each([
    "app/(student)/practice/readiness/start-screen.tsx",
    "app/(student)/practice/readiness/results/page.tsx",
    "features/simulation/practice-landing.tsx",
    "features/journey/home-plan.ts",
    "features/assessment/assessment-introduction.tsx",
  ])("%s", (file) => {
    expect(readFileSync(file, "utf8")).not.toMatch(/\b(5|five|Five) (workplace )?(questions|situations)\b/);
  });
  it("the intro is given the sitting's own size", () => {
    expect(readFileSync("features/assessment/assessment-run.tsx", "utf8")).toContain("questions={questionLimit}");
  });
});
