import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { examplesFor, FIELD_GUIDES, roleFamily, type FieldGuide, type GuideKey } from "./field-guidance";
import { FieldHelp, GuideProvider } from "./field-help";
import { DRAFT_LIMITS } from "./resume-draft-validation";

const keys = Object.keys(FIELD_GUIDES) as GuideKey[];
const allExamples = keys.flatMap((key) => {
  const guide: FieldGuide = FIELD_GUIDES[key];
  return Object.values(guide.examples).flatMap((set) => [...set!.student, ...set!.early_career].map((line) => ({ key, line })));
});

describe("the guidance behind each ⓘ", () => {
  it("says what to write and gives examples for both tracks, for every field", () => {
    for (const key of keys) {
      const guide: FieldGuide = FIELD_GUIDES[key];
      expect(guide.expected.length, key).toBeGreaterThan(0);
      expect(guide.examples.general.student.length, key).toBeGreaterThan(0);
      expect(guide.examples.general.early_career.length, key).toBeGreaterThan(0);
    }
  });

  it("keeps examples free of filler recruiters skip and screening software ignores", () => {
    const filler = /\b(hardworking|hard-working|passionate|team player|go-getter|dynamic|synergy|results-driven|self-motivated|responsible for|worked on|helped with|seeking a challenging)\b/i;
    expect(allExamples.filter(({ line }) => filler.test(line))).toEqual([]);
  });

  it("writes examples the way a resume is written: no I, my, you or your", () => {
    expect(allExamples.filter(({ line }) => /\b(i|my|me|you|your)\b/i.test(line))).toEqual([]);
  });

  it("keeps examples inside the limits of the field they are for", () => {
    const over = allExamples.filter(({ key, line }) =>
      (key === "experience.bullets" && line.length > DRAFT_LIMITS.bullet) ||
      (key === "summary.text" && line.length > DRAFT_LIMITS.summary) ||
      (key === "skills.items" && line.length > DRAFT_LIMITS.skill) ||
      (key === "projects.detail" && line.length > DRAFT_LIMITS.projectDetail));
    expect(over).toEqual([]);
  });

  it("never suggests personal details recruiters ask to leave off", () => {
    expect(allExamples.filter(({ line }) => /date of birth|\bdob\b|marital|religion|father'?s name|salary|ctc/i.test(line))).toEqual([]);
  });

  it("starts every example point with an action verb, not a duty", () => {
    for (const { line } of allExamples.filter((e) => e.key === "experience.bullets")) expect(line, line).toMatch(/^[A-Z][a-z]+ed\b|^(Built|Ran|Kept|Cut|Set|Led|Won|Met|Sold|Wrote|Grew|Made)\b/);
  });
});

describe("examples fit the role the resume is for", () => {
  it.each([
    ["Relationship Executive", "banking"],
    ["DevOps Engineer", "tech"],
    ["System Development Engineer II", "tech"],
    ["Customer Support Associate", "support"],
    ["Customer Success Associate", "support"],
    ["Hub Supervisor", "logistics"],
    ["Operations Executive", "operations"],
    ["Retail Sales Associate", "sales"],
    ["Chef", "general"],
    ["", "general"],
  ])("%s → %s", (role, family) => expect(roleFamily(role)).toBe(family));

  it("uses the role family's examples where there are some, and general ones otherwise", () => {
    expect(examplesFor("experience.bullets", "early_career", "Hub Supervisor").family).toBe("logistics");
    expect(examplesFor("header.email", "early_career", "Hub Supervisor").family).toBe("general");
    expect(examplesFor("summary.text", "student", null).lines).toEqual(FIELD_GUIDES["summary.text"].examples.general.student);
  });
});

describe("the ⓘ itself", () => {
  it("is a labelled button that opens a dialog, closed at first", () => {
    const html = renderToStaticMarkup(<GuideProvider track="student" role="Hub Supervisor"><FieldHelp field="experience.bullets" label="What you did" /></GuideProvider>);
    expect(html).toMatch(/<button[^>]*aria-label="How to write: What you did"[^>]*aria-haspopup="dialog"/);
    expect(html).not.toContain('role="dialog"');
  });

  it("makes the examples impossible to select, copy or drag, and draws the panel outside the field's label", () => {
    const src = readFileSync("features/resume/field-help.tsx", "utf8");
    expect(src).toMatch(/data-example onCopy=\{block\} onCut=\{block\} onDragStart=\{block\} className="[^"]*select-none/);
    expect(src).toContain("createPortal(");
  });
});

describe("every resume field has an ⓘ, and no line of small print", () => {
  it("in the editor", () => {
    const src = readFileSync("features/resume/resume-section-editor.tsx", "utf8");
    const fields = [...src.matchAll(/<Field\b/g)].length;
    expect(fields).toBe(25);
    expect([...src.matchAll(/<Field guide=/g)].length).toBe(fields);
    expect(src).not.toMatch(/hint=/);
    expect(src).toContain('aria-labelledby={`${id}-label`}');
  });

  it("in Your details", () => {
    const src = readFileSync("features/resume/resume-setup.tsx", "utf8");
    expect(src).not.toContain("One to three lines. Numbers help");
    expect(src).not.toContain("Comma separated. Only what you could back up");
    expect(src).not.toMatch(/<label className=\{label\}>/);
    expect([...src.matchAll(/<Labelled\b/g)].length).toBeGreaterThanOrEqual(14);
  });
});

it("places the ⓘ right after the label text or its asterisk, not at the far edge", () => {
  expect(readFileSync("features/resume/resume-workbench.module.css", "utf8")).toContain(".fieldHead{display:flex;align-items:center;justify-content:flex-start;gap:2px}");
  const setup = readFileSync("features/resume/resume-setup.tsx", "utf8");
  expect(setup).toContain('<span className="flex items-center justify-start gap-0.5"><span id={id}>{text}{required && <RequiredMark />}</span>{guide && <FieldHelp');
  expect(setup).not.toContain('justify-between gap-1"><span id={id}>');
});

it("draws the ⓘ as the app's outlined info icon, not a letter in a ring", () => {
  const html = renderToStaticMarkup(<GuideProvider track="student"><FieldHelp field="experience.bullets" label="What you did" /></GuideProvider>);
  expect(html).toMatch(/aria-label="How to write: What you did"[\s\S]*?<svg aria-hidden="true"[^>]*width="18"[^>]*><circle cx="12" cy="12" r="9.5"><\/circle>/);
  const css = readFileSync("features/resume/field-help.module.css", "utf8");
  // No teal tint at rest: the badge is the builder's neutral grey.
  expect(css).toMatch(/\.badge\{[^}]*background:var\(--color-slate-100\)/);
  expect(css).not.toMatch(/\.badge\{[^}]*brand-violet-soft/);
  expect(html).not.toMatch(/>i<\/span>/);
});
