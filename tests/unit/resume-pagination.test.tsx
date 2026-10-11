import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { resumePage } from "@/features/resume";
import { SavedResumes, ResumeStudio } from "@/features/resume";

describe("saved resume pagination", () => {
  it("keeps every resume reachable once across pages of at most ten", () => {
    const entries = Array.from({ length: 25 }, (_, i) => `resume-${i}`);
    const pages = [0, 1, 2].map(page => resumePage(entries, page));
    expect(pages.map(page => page.entries.length)).toEqual([10, 10, 5]);
    expect(pages.flatMap(page => page.entries)).toEqual(entries);
  });
  it("avoids an empty page at exact boundaries and clamps after entries are removed", () => {
    const ten = Array.from({ length: 10 }, (_, i) => i + 1);
    expect(resumePage(ten, 0).pages).toBe(1);
    expect(resumePage([...ten, 11], 2)).toMatchObject({ page: 1, entries: [11] });
    expect(resumePage([], 2)).toMatchObject({ page: 0, pages: 1, entries: [] });
  });
  function render(count: number) {
    return renderToStaticMarkup(createElement(SavedResumes, {
      signedIn: true,
      profile: { version: 1, createdAt: "2026-09-11", education: [], experience: [], projects: [], achievements: [],
        preferences: { resumeLedger: Array.from({ length: count }, (_, i) => ({ at: `2026-09-${String(i + 1).padStart(2, "0")}T10:00:00Z`, role: `Saved role ${i + 1}` })) },
      },
    }));
  }
  it("shows the newest ten on the separate saved-resumes page", () => {
    const html = render(25);
    expect(html.match(/>Saved role \d+</g)).toHaveLength(10);
    expect(html).toContain(">Saved role 25<");
    expect(html).toContain(">Saved role 16<");
    expect(html).not.toContain(">Saved role 15<");
    expect(html).toContain("Page 1 of 3");
    expect(html).toContain("1–10 of 25 resumes");
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Previous<\/button>/);
    expect(html).toContain("My resumes");
    expect(html).not.toContain("Preview · Basic");
  });
  it("hides page controls when ten or fewer resumes exist", () => {
    expect(render(10)).not.toContain('aria-label="Saved resume pages"');
    expect(render(11)).toContain('aria-label="Saved resume pages"');
    expect(render(0)).not.toContain("Your saved resumes");
  });
});

it("keeps saved-resume history out of the new-resume form", () => {
  const html = renderToStaticMarkup(createElement(ResumeStudio, {target:null, profile:{version:1,createdAt:"2026-10-05",education:[],experience:[],projects:[],achievements:[],preferences:{resumeLedger:[{role:"Archived resume only",at:"2026-10-01"}]}}}));
  expect(html).toContain('href="/resume/saved"');
  expect(html).toContain(">Create resume</h1>");
  expect(html).not.toContain("Archived resume only");
  expect(html).not.toContain("Your saved resumes");
});

describe("My resumes as cards", () => {
  it("shows each saved resume as a card with a picture of it, what it is for and when it was made", async () => {
    const { SavedResumes, EXAMPLE_RESUME } = await import("@/features/resume");
    const ledger = [
      { role: "No particular role", at: "2026-10-10T03:00:00.000Z", resume: EXAMPLE_RESUME, template: "classic", downloadedAt: "2026-10-10T03:05:00.000Z" },
      { role: "Support Engineer", at: "2026-10-11T03:00:00.000Z", resume: EXAMPLE_RESUME, displayTemplate: "professional" },
    ];
    const html = renderToStaticMarkup(<SavedResumes signedIn profile={{ version: 1, createdAt: "2026-10-10", education: [], experience: [], projects: [], achievements: [], preferences: { resumeLedger: ledger } }} />);
    // Newest first, marked as the latest; a general resume is called that.
    expect(html.indexOf("Support Engineer")).toBeLessThan(html.indexOf("General resume"));
    expect(html).toMatch(/data-tone="latest"[^>]*>Latest</);
    expect(html).toContain("Professional layout");
    expect(html).toContain(">Downloaded</b>");
    expect(html).not.toContain(">No particular role<");
    // A picture of each, and the whole card opens it.
    expect(html.match(/aspect-\[1\/1\.414\]/g)?.length).toBe(2);
    const link = html.match(/<a[^>]*aria-label="Open Support Engineer[^>]*>/)?.[0] ?? "";
    expect(link).toContain('href="/resume/build?record=2026-10-11');
  });
});

it("keeps each card's picture to the card's width, so the page inside shrinks to fit", async () => {
  const { readFileSync } = await import("node:fs");
  const css = readFileSync("features/resume/saved-resumes.module.css", "utf8");
  expect(css).toContain(".card{display:grid;grid-template-columns:minmax(0,1fr);");
  expect(css).toMatch(/\.thumb\{display:block;min-width:0;overflow:hidden;/);
});
