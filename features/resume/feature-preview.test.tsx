import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FeaturePreview, FeatureTour, type PreviewKind } from "./feature-preview";

// A signed-out visitor sees each feature an account adds as the real screen
// with sample content: marked as an example, not usable, one way in.

const preview = (kind: PreviewKind) => renderToStaticMarkup(<FeaturePreview kind={kind} />);

describe("previews of what an account adds", () => {
  it("shows each one as an example that cannot be used, ending on Create an account", () => {
    for (const kind of ["draft", "suggestions", "review", "polish"] as const) {
      const html = preview(kind);
      expect(html).toContain(">Example</span>");
      expect(html).toMatch(/<div[^>]*inert=""/);
      expect(html).toContain('href="/signup?next=%2Fresume%2Fbuild"');
      expect(html).toContain(">Create an account to use this</a>");
    }
  });

  it("draws the real screens with sample content", () => {
    expect(preview("draft")).toContain("Say I handled about 200 customers a day");
    expect(preview("draft")).toContain("Regenerate resume · 2");
    expect(preview("suggestions")).toContain("Received the store&#x27;s best-employee award");
    expect(preview("review")).toContain("What they expect to see");
    expect(preview("review")).toContain("Check my readiness");
    expect(preview("polish")).toContain("Billed around 200 customers a day at the counter.");
  });

  it("tours all four, one at a time", () => {
    const html = renderToStaticMarkup(<FeatureTour />);
    for (const label of ["Request changes", "Suggestions", "AI Recruiter Review", "Improve with AI"]) expect(html).toContain(`>${label}</button>`);
    expect(html).toMatch(/aria-pressed="true"[^>]*>Request changes</);
  });
});
