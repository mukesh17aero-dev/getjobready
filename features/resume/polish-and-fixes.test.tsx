import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { SAMPLE_RESUME } from "./starter-resumes";
import { ResumeSectionEditor, type ResumeSection } from "./resume-section-editor";
import { PolishProvider } from "./polish-button";
import { applyResumeFix, type ResumeData, type ResumeFix } from "./resume-api";

const editor = (section: ResumeSection, withPolish = true) =>
  renderToStaticMarkup(
    <PolishProvider request={withPolish ? async () => null : null}>
      <ResumeSectionEditor section={section} resume={{ ...SAMPLE_RESUME, achievements: ["Won the fest"], projects: [{ title: "Billing app", detail: "Built it", tools: [] }] }} onChange={() => {}} disabled={false} />
    </PolishProvider>,
  );
const sparks = (html: string) => (html.match(/aria-label="Rewrite [^"]+ with AI"/g) ?? []).length;

describe("the ✦ after a field", () => {
  it("is on the fields a person explains in their own words", () => {
    expect(editor("summary")).toContain('aria-label="Rewrite Your introduction with AI"');
    expect(editor("experience")).toContain('aria-label="Rewrite What you did with AI"');
    expect(sparks(editor("experience"))).toBe(SAMPLE_RESUME.experience.length);
    expect(sparks(editor("education"))).toBe(SAMPLE_RESUME.education.length);
    expect(sparks(editor("projects"))).toBe(1);
    expect(sparks(editor("achievements"))).toBe(1);
    expect(sparks(editor("activities"))).toBe(1);
  });

  it("is not on facts: contact details, skills, certifications, languages, interests", () => {
    for (const section of ["header", "skills", "certifications", "languages", "interests"] as const) expect(sparks(editor(section))).toBe(0);
  });

  it("is not shown at all where nobody can ask for a rewrite (examples, signed out)", () => {
    expect(sparks(editor("experience", false))).toBe(0);
  });
});

describe("applying a suggested fix", () => {
  const resume: ResumeData = { ...SAMPLE_RESUME };
  const firstBullet = resume.experience[0]!.bullets[0]!;
  const fix: ResumeFix = { section: "experience", entry: 0, line: 0, before: firstBullet, after: "Handled the front counter", why: "Starts with an action." };

  it("swaps exactly that line and nothing else", () => {
    const next = applyResumeFix(resume, fix)!;
    expect(next.experience[0]!.bullets[0]).toBe("Handled the front counter");
    expect(next.experience[0]!.bullets.slice(1)).toEqual(resume.experience[0]!.bullets.slice(1));
    expect(next.summary).toBe(resume.summary);
  });

  it("never overwrites a line the person has changed since", () => {
    const edited = { ...resume, experience: resume.experience.map((job, i) => (i === 0 ? { ...job, bullets: ["My own new wording", ...job.bullets.slice(1)] } : job)) };
    expect(applyResumeFix(edited, fix)).toBeNull();
  });

  it("refuses a place the resume does not have", () => {
    expect(applyResumeFix(resume, { ...fix, entry: 40 })).toBeNull();
  });
});

it("says what the ✦ does, in words, and why it waits when the box is empty", () => {
  const html = editor("experience");
  expect(html).toMatch(/aria-label="Rewrite What you did with AI"[^>]*>[\s\S]*?Improve with AI<\/span><\/button>/);
  // The sample has words in every field, so no "write first" hint here; an empty box shows it.
  const code = readFileSync("features/resume/polish-button.tsx", "utf8");
  expect(code).toContain('{empty && <span className={s.hint}>Write a few words or pointers first</span>}');
});
