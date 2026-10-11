import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { sectionStatuses } from "./section-status";
import { SAMPLE_RESUME } from "./starter-resumes";
import { ResumeWorkbench } from "./resume-workbench";
import type { ResumeData } from "./resume-api";

const empty: ResumeData = { header: { name: "", city: "", email: "" }, summary: "", skills: [], experienceHeading: "Experience", experience: [], education: [], languages: [], activities: [], keywordsUsed: [] };

describe("what each section button says", () => {
  it("marks every required section of an empty resume as needed, and optional ones as empty", () => {
    const st = sectionStatuses(empty);
    for (const id of ["header", "summary", "experience", "education", "skills"] as const) expect(st[id]).toBe("needed");
    for (const id of ["projects", "certifications", "achievements", "languages", "activities", "interests"] as const) expect(st[id]).toBe("empty");
  });

  it("marks a filled optional section as done", () => {
    expect(sectionStatuses({ ...empty, languages: ["Hindi"] }).languages).toBe("done");
  });

  it("follows the download rules: a name without an email still needs contact details", () => {
    expect(sectionStatuses({ ...empty, header: { name: "Aarav", city: "", email: "" } }).header).toBe("needed");
    expect(sectionStatuses({ ...empty, header: { name: "Aarav", city: "", email: "a@b.in" } }).header).toBe("done");
  });
});

describe("the section buttons in Edit sections", () => {
  const html = renderToStaticMarkup(createElement(ResumeWorkbench, { resume: SAMPLE_RESUME, template: "classic", role: "", onChange: () => {}, onTemplate: () => {}, disabled: false, example: false, saveLabel: "", saveFailed: false, onRetry: () => {}, templateChosen: true }));

  it("shows every section at once instead of a dropdown", () => {
    expect(html).not.toContain("<select");
    expect(html).toContain('aria-label="Resume sections"');
    expect(html.match(/<nav[^>]*aria-label="Resume sections"[\s\S]*?<\/nav>/)?.[0].match(/<button/g)).toHaveLength(11);
  });

  it("marks the open section, and says each section's state to a screen reader", () => {
    expect(html).toMatch(/aria-current="true"[^>]*>(<svg[\s\S]*?<\/svg>)?Contact details/);
    expect(html).toMatch(/\((needed before download|has content|optional)\)/);
  });

  it("pins the row while the panel scrolls, but not on a phone, and enlarges Previous and Next", () => {
    const css = readFileSync("features/resume/resume-workbench.module.css", "utf8");
    expect(css).toMatch(/\.sectionTabs\{position:sticky;/);
    expect(css).toContain("@media(max-width:680px){.sectionTabs{position:static}}");
    expect(css).toContain(".sectionNav button{font-size:15px;font-weight:650;min-height:44px;");
  });
});
