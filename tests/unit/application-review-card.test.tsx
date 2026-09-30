import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ApplicationReviewCard } from "@/features/passport";
import type { ApplicationReviewStatus } from "@/lib/api";

const render = (status: ApplicationReviewStatus) => renderToStaticMarkup(createElement(ApplicationReviewCard, { status }));
const DISCLAIMER = "not a prediction of an employer&#x27;s decision";

describe("application review card", () => {
  it("says what is still needed, with one way forward, before a review is worth writing", () => {
    const html = render({ state: "locked", roleTitle: "Operations Executive", missing: ["A scored readiness assessment for Operations Executive"] });
    expect(html).toContain(DISCLAIMER);
    expect(html).toContain("A scored readiness assessment for Operations Executive");
    expect(html).toContain("Take the readiness sitting");
    expect(html).not.toContain("Get my application review");
  });

  it("offers to write the first review once unlocked", () => {
    const html = render({ state: "ready", roleTitle: "Operations Executive", saved: null, canWrite: true, why: null });
    expect(html).toContain("Get my application review");
  });

  it("shows a written review with its evidence named in plain words and one next step", () => {
    const html = render({
      state: "ready", roleTitle: "Operations Executive", canWrite: false, why: "Your review is up to date.",
      saved: {
        roleTitle: "Operations Executive", createdAt: "2026-09-30T10:00:00Z",
        review: {
          firstImpression: "Someone who has practised the real work, with little on paper yet.",
          standsOut: [{ point: "Your sitting scored well on records.", evidence: ["A1"] }],
          pause: [{ point: "There is no resume yet.", evidence: ["missing"] }],
          questions: ["How do you keep track of many tasks?", "How do you check your work?"],
          plan: [{ step: "Build a one-page resume aimed at this role.", tool: "resume" }],
        },
      },
    });
    expect(html).toContain(DISCLAIMER);
    expect(html).toContain("Readiness assessment 1");
    expect(html).toContain("Not in your application yet");
    expect(html).toContain('href="/resume/build"');
    expect(html).toContain("Your review is up to date.");
    expect(html.match(/min-h-11 items-center rounded-xl bg-\[#5b21b6\]/g)).toHaveLength(1);
  });
});
