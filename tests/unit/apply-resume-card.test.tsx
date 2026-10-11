import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ApplyWorkspace } from "../../app/(student)/resume/apply-workspace";
import { snapshotFromResume } from "../../app/(student)/resume/resume-excerpt";
import { EXAMPLE_RESUME } from "@/features/resume";

describe("the Resume card on Apply", () => {
  const page = (withSaved: boolean) => renderToStaticMarkup(
    <ApplyWorkspace name="" role={null} work={null} resume={withSaved ? snapshotFromResume(EXAMPLE_RESUME, "") : null}
      professional={null} check={null} signedIn available={{ resume: true, linkedin: true, fit: true }} />,
  );
  const card = (html: string) => html.slice(html.indexOf("<h2>Resume</h2>"), html.indexOf("<h2>LinkedIn</h2>"));

  it("always offers to build a resume, even once one is saved", () => {
    for (const html of [page(false), page(true)]) expect(card(html)).toMatch(/href="\/resume\/build"[^>]*>Create a resume/);
  });

  it("adds the saved ones beside it once there are any", () => {
    expect(card(page(true))).toMatch(/href="\/resume\/saved"[^>]*>My resumes</);
    expect(card(page(false))).not.toContain("/resume/saved");
  });
});
