import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { ResumeStudio } from "./resume-studio";
import { hasNothingSaved } from "./resume-setup";
import { periodOf, resumeFromProfile } from "./resume-from-profile";
import type { ResumeCareerProfile } from "./resume-api";

const profile = (over: Partial<ResumeCareerProfile>): ResumeCareerProfile =>
  ({ version: 1, createdAt: "2026-10-07", education: [], experience: [], projects: [], achievements: [], preferences: {}, ...over }) as ResumeCareerProfile;

const prefs = { fullName: "Aarav Sharma", city: "Hyderabad", phone: "98765 43210", link: "linkedin.com/in/aarav", skills: "Customer care, Google Sheets, Hindi", languages: "English, Hindi, Telugu" };

describe("writing it yourself starts from the profile, copied as saved", () => {
  it("fills the header, skills and languages", () => {
    const r = resumeFromProfile(profile({ preferences: prefs }), false);
    expect(r.header).toEqual({ name: "Aarav Sharma", city: "Hyderabad", email: "", phone: "98765 43210", link: "linkedin.com/in/aarav" });
    expect(r.skills).toEqual([{ group: "Skills", items: ["Customer care", "Google Sheets", "Hindi"] }]);
    expect(r.languages).toEqual(["English", "Hindi", "Telugu"]);
  });

  it("copies education and work rows with their dates, and puts a college project under projects, not jobs", () => {
    const r = resumeFromProfile(profile({
      preferences: prefs,
      education: [{ qualification: "B.Com", institution: "Osmania University", from: "2023", to: "", current: "yes", marks: "78%" }],
      experience: [
        { kind: "job", title: "Cashier", organisation: "Lumen Retail", from: "2024", to: "2025", detail: "Billed 200 customers a day" },
        { kind: "project", title: "Stock tracker", detail: "Built in Google Sheets for the family shop" },
      ],
    }), true);
    expect(r.education).toEqual([{ qualification: "B.Com", institution: "Osmania University", period: "2023 – Present", detail: "78%" }]);
    expect(r.experience).toEqual([{ title: "Cashier", organisation: "Lumen Retail", period: "2024 – 2025", bullets: ["Billed 200 customers a day"] }]);
    expect(r.projects).toEqual([{ title: "Stock tracker", detail: "Built in Google Sheets for the family shop", tools: [] }]);
    expect(r.experienceHeading).toBe("Work experience");
  });

  it("falls back to the profile page's own fields when there are no rows", () => {
    const r = resumeFromProfile(profile({ preferences: { ...prefs, institution: "Osmania University", course: "B.Com", expectedFinish: "2026", currentRole: "Store associate", employer: "Lumen Retail", activities: "NSS volunteer\nCollege fest registration desk", storySummary: "I like solving customer problems." } }), false);
    expect(r.education).toEqual([{ qualification: "B.Com", institution: "Osmania University", period: "Expected 2026", detail: "" }]);
    expect(r.experience).toEqual([{ title: "Store associate", organisation: "Lumen Retail", period: "", bullets: [] }]);
    expect(r.activities).toEqual(["NSS volunteer", "College fest registration desk"]);
    // The profile summary is the app's note to them, not resume text.
    expect(r.summary).toBe("");
    expect(r.summaryHeading).toBe("Career objective");
  });

  it("adds nothing the profile does not hold", () => {
    const r = resumeFromProfile(profile({ preferences: { fullName: "Aarav Sharma" } }), false);
    expect(r).toMatchObject({ summary: "", skills: [], experience: [], education: [], projects: [], languages: [], activities: [], keywordsUsed: [] });
  });

  it("formats periods", () => {
    expect(periodOf({ from: "2023", to: "2026" })).toBe("2023 – 2026");
    expect(periodOf({ from: "2023", current: true })).toBe("2023 – Present");
    expect(periodOf({ from: "2023" })).toBe("2023");
    expect(periodOf({})).toBe("");
  });
});

describe("the write-it-myself start", () => {
  const src = readFileSync("features/resume/resume-studio.tsx", "utf8");
  const body = src.slice(src.indexOf("function startWriting("), src.indexOf("function continueFromStart("));

  it("asks for the same details as building from them before opening the editor", () => {
    expect(body).toMatch(/if \(gaps\.length > 0\) \{[\s\S]*?setSetupStep\(firstStepFor\(gaps\)\);[\s\S]*?return;/);
    expect(body).toMatch(/if \(!trackChoice\) \{[\s\S]*?return;/);
    expect(body.indexOf("gaps.length > 0")).toBeLessThan(body.indexOf('go("draft")'));
  });

  it("opens the editor with the profile copied in, not an empty page", () => {
    expect(body).toContain('resume: resumeFromProfile(profile, trackChoice === "early_career")');
    expect(src).toContain('{ id: "write" as const, name: "Write it myself", Icon: Pencil }');
  });
});

describe("the start options follow what the profile holds", () => {
  const start = (prefs: Record<string, unknown>) =>
    renderToStaticMarkup(<ResumeStudio target={null} profile={profile({ preferences: prefs })} />);

  it("asks someone with nothing saved to fill in their details, with no write-it-myself", () => {
    expect(hasNothingSaved(profile({}))).toBe(true);
    const html = start({});
    expect(html).toContain("Fill in my details");
    expect(html).not.toContain("Use my saved details");
    expect(html).not.toContain("Write it myself");
  });

  it("offers saved details, and writing it yourself, once anything is saved", () => {
    expect(hasNothingSaved(profile({ preferences: { fullName: "Aarav Sharma" } }))).toBe(false);
    const html = start({ fullName: "Aarav Sharma" });
    expect(html).toContain("Use my saved details");
    expect(html).toMatch(/role="radio"[^>]*>[\s\S]*?<strong>Write it myself<\/strong>/);
  });

  it("puts no explanatory line under either option", () => {
    const html = start(prefs);
    for (const gone of ["Use your saved profile", "Start with a PDF or Word file", "Create from my details"]) expect(html).not.toContain(gone);
    // An icon, the name and the selection mark - no line of explanation.
    for (const name of ["Use my saved details", "Upload a resume", "Write it myself"]) expect(html).toMatch(new RegExp(`role="radio"[^>]*><span[^>]*><svg[\\s\\S]*?</svg></span><strong>${name}</strong><span[^>]*></span></button>`));
    // Nothing below the choice until one is made.
    expect(html).not.toContain("Target role (optional)");
    expect(html).not.toContain('id="resume-track"');
  });
});

describe("a profile bigger than a resume still gives a resume that saves", () => {
  const many = (n: number, word: string) => Array.from({ length: n }, (_, i) => `${word} ${i + 1}`);
  const longText = Array.from({ length: 40 }, (_, i) => `Handled task number ${i + 1} for the store team.`).join(" ");
  const huge = profile({
    preferences: {
      fullName: "Aarav Sharma", phone: "98765 43210", city: "Hyderabad",
      skills: many(23, "Skill").join(", "),
      languages: many(12, "Lang").join(", "),
      activities: many(9, "Activity").join("\n"),
      storySummary: longText,
    },
    experience: Array.from({ length: 8 }, (_, i) => ({ kind: "job", title: `Job ${i + 1}`, organisation: "Lumen Retail", detail: longText })),
    education: Array.from({ length: 6 }, (_, i) => ({ qualification: `Course ${i + 1}`, institution: "Osmania University" })),
  });

  it("passes the draft's own save rules", async () => {
    const { resumeDraftIssue } = await import("./resume-draft-validation");
    expect(resumeDraftIssue(resumeFromProfile(huge, true))).toBeNull();
  });

  it("splits skills into groups of ten rather than dropping them", () => {
    const r = resumeFromProfile(huge, false);
    expect(r.skills.map((g) => g.items.length)).toEqual([10, 10, 3]);
    expect(r.skills.map((g) => g.group)).toEqual(["Skills", "More skills", "Other skills"]);
  });

  it("shortens long text at a sentence end, never mid-word", async () => {
    const { fit, bulletsOf } = await import("./resume-from-profile");
    const short = fit(longText, 700);
    expect(short.length).toBeLessThanOrEqual(700);
    expect(short.endsWith(".")).toBe(true);
    expect(bulletsOf(longText)).toHaveLength(5);
    expect(bulletsOf(longText)[0]).toBe("Handled task number 1 for the store team.");
    expect(fit("one two three four", 9)).toBe("one two");
  });
});

it("says a full skills group in plain words", async () => {
  const { resumeDraftIssue } = await import("./resume-draft-validation");
  const r = resumeFromProfile(profile({ preferences: { fullName: "Aarav" } }), false);
  const issue = resumeDraftIssue({ ...r, skills: [{ group: "Skills", items: Array.from({ length: 12 }, (_, i) => `S${i}`) }] });
  expect(issue).toBe("Skills group 1 has more than 10 skills. Move some into another group or remove a few - your changes are not saved until then.");
});

it("shows no resume preview on Your details: the resume is first seen in the editor, after a layout is picked", async () => {
  const { existsSync } = await import("node:fs");
  const html = renderToStaticMarkup(<ResumeStudio target={null} profile={profile({ preferences: { fullName: "Aarav Sharma", city: "Hyderabad" } })} />);
  expect(html).not.toContain("Your preview");
  expect(html).not.toContain("Preview of your saved details");
  expect(html).not.toContain('id="resume-sheet"');
  expect(existsSync("features/resume/resume-setup-preview.tsx")).toBe(false);
  expect(readFileSync("features/resume/resume-studio.tsx", "utf8")).toContain("templateChosen={templatePicked}");
});

describe("copied text is written as the person's own resume, without I or you", async () => {
  const { resumeVoice } = await import("./resume-voice");
  it.each([
    ["You're a retail associate with a year of billing experience.", "Retail associate with a year of billing experience."],
    ["You've led a team of 15 during the festive rush.", "Led a team of 15 during the festive rush."],
    ["I am a store associate. I led a team of 15.", "Store associate. Led a team of 15."],
    ["Built dashboards with your team, and you have shipped them weekly.", "Built dashboards with the team, and shipped them weekly."],
    ["Handled my store's daily cash reconciliation.", "Handled store's daily cash reconciliation."],
  ])("%s", (before, after) => expect(resumeVoice(before)).toBe(after));

  it("leaves text without pronouns, Roman numerals and abbreviations alone", () => {
    for (const t of ["System Development Engineer II at a logistics firm.", "Phase I of the project, i.e. the pilot, ran across 2 sites.", "Handled 40 tickets a day."]) expect(resumeVoice(t)).toBe(t);
  });

  it("applies to job descriptions, project details and activities copied from the profile", () => {
    const r = resumeFromProfile(profile({
      preferences: { fullName: "Aarav Sharma", activities: "I organised the college fest\nYou volunteered with NSS" },
      experience: [{ kind: "job", title: "Cashier", organisation: "Lumen Retail", detail: "I billed 200 customers a day." }, { kind: "project", title: "Stock tracker", detail: "I built it in Google Sheets for my family shop." }],
    }), false);
    expect(r.experience[0]?.bullets).toEqual(["Billed 200 customers a day."]);
    expect(r.projects?.[0]?.detail).toBe("Built it in Google Sheets for the family shop.");
    expect(r.activities).toEqual(["Organised the college fest", "Volunteered with NSS"]);
  });
});
