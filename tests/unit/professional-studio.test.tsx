import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ProfessionalStudio } from "@/app/(student)/profile/professional/professional-studio";
import { SAMPLE_PROFILE } from "@/features/profile";

describe("LinkedIn profile editor", () => {
  it("opens an existing profile as a direct editor with required fields and contextual help", () => {
    const html = renderToStaticMarkup(<ProfessionalStudio initial={SAMPLE_PROFILE} />);
    expect(html).toContain('id="profile-headline"');
    expect(html).toContain('aria-required="true"');
    expect(html).toContain("How to write: Write a clear headline");
    expect(html).toContain("Keep headline");
    expect(html).not.toContain("Ask Scribe");
  });

  it("marks the starting choices and optional photo clearly for a guest", () => {
    const html = renderToStaticMarkup(<ProfessionalStudio initial={SAMPLE_PROFILE} signedOut />);
    expect(html).toContain("Starting source (required)");
    expect(html).toContain("Voice (required)");
    expect(html).toContain("Add photo (optional)");
  });
});
