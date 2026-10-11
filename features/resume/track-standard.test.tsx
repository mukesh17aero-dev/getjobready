import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { SAMPLE_RESUME } from "./starter-resumes";
import { ResumeSectionEditor, resumeSections } from "./resume-section-editor";
import { ResumeWorkbench } from "./resume-workbench";
import { TRACK_STANDARD } from "./track-standard";

// Student or working is the first input: the order of the sections, which
// ones are required, which fold away - and every AI call is told it.

const order = (track: "student" | "early_career") => resumeSections(track).map(([id]) => id);
const chips = (track: "student" | "early_career") => {
  const html = renderToStaticMarkup(<ResumeWorkbench resume={{ ...SAMPLE_RESUME, activities: [], interests: [] }} template="classic" role="" track={track} onChange={() => {}} onTemplate={() => {}} disabled={false} example={false} saveLabel="" saveFailed={false} onRetry={() => {}} templateChosen />);
  return html.match(/<nav[^>]*aria-label="Resume sections"[\s\S]*?<\/nav>/)?.[0] ?? "";
};

describe("each level's own order", () => {
  it("leads a student with education and projects, a professional with work", () => {
    expect(order("student").slice(0, 4)).toEqual(["header", "summary", "education", "projects"]);
    expect(order("early_career").slice(0, 4)).toEqual(["header", "summary", "experience", "achievements"]);
    expect(order("early_career").indexOf("education")).toBeGreaterThan(order("early_career").indexOf("skills"));
  });
});

describe("each level's own required sections", () => {
  const legend = (track: "student" | "early_career") => renderToStaticMarkup(<ResumeSectionEditor section="experience" track={track} resume={SAMPLE_RESUME} onChange={() => {}} disabled={false} />).match(/<legend[^>]*>[\s\S]*?<\/legend>/)?.[0] ?? "";
  it("requires work experience of a professional, not of a student", () => {
    expect(legend("early_career")).toContain("(required)");
    expect(legend("student")).not.toContain("(required)");
  });
});

describe("sections a level rarely needs fold away", () => {
  it("folds interests for a student, activities and interests for a professional, behind More sections", () => {
    expect(chips("student")).toContain("+ More sections");
    expect(chips("student")).not.toContain(">Interests<");
    expect(chips("student")).toContain(">Activities<");
    expect(chips("early_career")).not.toContain(">Activities<");
    expect(chips("early_career")).not.toContain(">Interests<");
  });

  it("never folds a section that already has something in it", () => {
    const html = renderToStaticMarkup(<ResumeWorkbench resume={{ ...SAMPLE_RESUME, interests: ["Chess"] }} template="classic" role="" track="student" onChange={() => {}} onTemplate={() => {}} disabled={false} example={false} saveLabel="" saveFailed={false} onRetry={() => {}} templateChosen />);
    expect(html.match(/<nav[^>]*aria-label="Resume sections"[\s\S]*?<\/nav>/)?.[0]).toContain("Interests");
  });

  it("keeps a page length for each", () => {
    expect(TRACK_STANDARD.student.pages).toBe(1);
    expect(TRACK_STANDARD.early_career.pages).toBe(2);
  });
});

describe("every AI call is told the level", () => {
  it("Request changes, Suggestions and the AI Recruiter Review", () => {
    const studio = readFileSync("features/resume/resume-studio.tsx", "utf8");
    expect(studio).toContain("refineResume(t, { resume: base, comment: instruction, targetRole: result.targetRole, ...(trackChoice ? { track: trackChoice } : {})");
    expect(studio).toContain("reviewResume(t, { resume: asked, targetRole: result.targetRole, ...(trackChoice ? { track: trackChoice } : {})");
    expect(readFileSync("features/resume/resume-suggestions.tsx", "utf8")).toContain("...(track ? { track } : {}),");
  });
});

describe("the job posting stays with the resume and reaches every step", () => {
  it("is kept with the resume, saved with it and reopened with it", () => {
    const studio = readFileSync("features/resume/resume-studio.tsx", "utf8");
    expect(studio).toContain("...(opened.jobDescription ? { jobDescription: opened.jobDescription } : {})");
    expect(studio).toContain("setResult({ resume: generated.resume, targetRole: generated.targetRole, ...postingNow() });");
    expect(studio).toContain("...(result.jobDescription ? { jobDescription: result.jobDescription } : {}), template: exportTemplate(template)");
  });

  it("is what Request changes, the review and Suggestions are aimed at - and a reopened resume keeps its role", () => {
    const studio = readFileSync("features/resume/resume-studio.tsx", "utf8");
    expect(studio.match(/\.\.\.aimOf\(result\)/g)?.length).toBe(2);
    expect(studio).toContain('targetRole: /^no particular role$/i.test(opened.role.trim()) ? "" : opened.role');
    expect(readFileSync("features/resume/resume-suggestions.tsx", "utf8")).toContain("...(jobDescription ? { jobDescription } : {})");
  });

  it("says what the resume is tailored for, above the editor", () => {
    const studio = readFileSync("features/resume/resume-studio.tsx", "utf8");
    expect(studio).toContain('" · using the job posting you added"');
    expect(studio).toContain('"General resume · not aimed at a particular role"');
  });
});
