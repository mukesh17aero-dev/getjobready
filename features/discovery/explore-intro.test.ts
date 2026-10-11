import { describe, expect, it } from "vitest";
import { exploreIntro } from "./explore-intro";

describe("Explore career-stage messaging", () => {
  it("uses the current Home selection before a previously saved stage", () => {
    expect(exploreIntro("student", "early_career").eyebrow).toBe("EXPLORE YOUR FIRST ROLE");
    expect(exploreIntro("experienced", "student").eyebrow).toBe("EXPLORE YOUR NEXT MOVE");
  });
  it("uses the shared saved Home/Profile track when opening Explore directly", () => {
    expect(exploreIntro(null, "student").title).toBe("Find work that feels worth trying.");
    expect(exploreIntro(null, "early_career").title).toBe("Find a role to build on your experience.");
  });
  it("supports guest Home links and ignores invalid query values", () => {
    expect(exploreIntro("experienced").eyebrow).toBe("EXPLORE YOUR NEXT MOVE");
    expect(exploreIntro("unknown", "student")).toEqual(exploreIntro("student"));
  });
  it("does not assume a career stage when no valid choice is available", () => {
    expect(exploreIntro().eyebrow).toBe("EXPLORE YOUR OPTIONS");
    expect(exploreIntro("unknown", "unknown")).toEqual(exploreIntro());
  });
});
