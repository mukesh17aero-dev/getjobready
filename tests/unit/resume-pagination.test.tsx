import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { resumePage } from "@/features/resume";
import { ResumeStudio } from "@/app/(student)/resume/build/resume-studio";

describe("saved resume pagination", () => {
  it("keeps every resume reachable once across pages of at most five", () => {
    const entries = Array.from({ length: 12 }, (_, i) => `resume-${i}`);
    const pages = [0, 1, 2].map(page => resumePage(entries, page));
    expect(pages.map(page => page.entries.length)).toEqual([5, 5, 2]);
    expect(pages.flatMap(page => page.entries)).toEqual(entries);
  });
  it("avoids an empty page at exact boundaries and clamps after entries are removed", () => {
    expect(resumePage([1, 2, 3, 4, 5], 0).pages).toBe(1);
    expect(resumePage([1, 2, 3, 4, 5, 6], 2)).toMatchObject({ page: 1, entries: [6] });
    expect(resumePage([], 2)).toMatchObject({ page: 0, pages: 1, entries: [] });
  });
  function render(count: number) {
    return renderToStaticMarkup(createElement(ResumeStudio, {
      target: null,
      profile: { version: 1, createdAt: "2026-09-11", education: [], experience: [], projects: [], achievements: [],
        preferences: { resumeLedger: Array.from({ length: count }, (_, i) => ({ at: `2026-09-${String(i + 1).padStart(2, "0")}T10:00:00Z`, role: `Saved role ${i + 1}` })) },
      },
    }));
  }
  it("shows the newest five above the preview without truncating the total to ten", () => {
    const html = render(12);
    expect(html.match(/>Saved role \d+</g)).toHaveLength(5);
    expect(html).toContain(">Saved role 12<");
    expect(html).toContain(">Saved role 8<");
    expect(html).not.toContain(">Saved role 7<");
    expect(html).toContain("Page 1 of 3");
    expect(html).toContain("1–5 of 12 resumes");
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Previous<\/button>/);
    expect(html.indexOf("Your saved resumes")).toBeLessThan(html.indexOf("Preview · Basic"));
  });
  it("hides page controls when five or fewer resumes exist", () => {
    expect(render(5)).not.toContain('aria-label="Saved resume pages"');
    expect(render(0)).not.toContain("Your saved resumes");
  });
});
