import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { BLANK_STUDY, BLANK_WORK, profileEducation, profileExperience, studyDraft, workDraft } from "./profile-fields";
import { ResumeSetup, setupGaps } from "./resume-setup";
import type { ResumeCareerProfile } from "./resume-api";

// Shaped the way the profile page saves someone: everything in single fields,
// every list empty. This is the record that showed an empty preview.
const fromProfilePage = (prefs: Record<string, unknown>): ResumeCareerProfile =>
  ({ version: 1, createdAt: "2026-10-07", education: [], experience: [], projects: [], achievements: [], preferences: prefs }) as ResumeCareerProfile;

const filledIn = fromProfilePage({
  fullName: "Aarav Sharma",
  city: "Hyderabad",
  phone: "98765 43210",
  link: "linkedin.com/in/aarav",
  institution: "Osmania University",
  course: "B.Com",
  yearOfStudy: "Final year",
  currentRole: "Store associate",
  employer: "Lumen Retail",
  activities: "NSS volunteer",
  skills: "Customer service, Google Sheets, Hindi",
});

describe("reading the profile page's own fields", () => {
  it("finds education in institution and course when there are no rows", () => {
    expect(profileEducation(filledIn)).toEqual([{ title: "B.Com", place: "Osmania University", detail: "Final year" }]);
  });

  it("prefers an expected finish date to a year of study", () => {
    const p = fromProfilePage({ institution: "Osmania University", yearOfStudy: "Final year", expectedFinish: "2026" });
    expect(profileEducation(p)[0]?.detail).toBe("Expected 2026");
  });

  it("finds experience in role, employer, internship and activities", () => {
    expect(profileExperience(filledIn)).toEqual([
      { title: "Store associate", place: "Lumen Retail", detail: "" },
      { title: "Activities", place: "", detail: "NSS volunteer" },
    ]);
  });

  it("uses rows when there are rows, and does not mix in the single fields", () => {
    const withRows = { ...filledIn, education: [{ qualification: "BBA", institution: "St Joseph's" }] } as ResumeCareerProfile;
    expect(profileEducation(withRows)).toEqual([{ title: "BBA", place: "St Joseph's", detail: "" }]);
  });

  it("finds nothing in an empty profile, or in fields that are blank", () => {
    expect(profileEducation(null)).toEqual([]);
    expect(profileExperience(fromProfilePage({ currentRole: " ", employer: "x", activities: "" }))).toEqual([]);
  });
});

describe("the builder no longer asks again for what the profile says", () => {
  it("has no education or experience gap for a profile saved by the profile page", () => {
    expect(setupGaps(filledIn).map((g) => g.item)).toEqual([]);
  });

  it("still asks for what is genuinely missing", () => {
    const noPhone = fromProfilePage({ ...filledIn.preferences, phone: "" });
    expect(setupGaps(noPhone).map((g) => g.item)).toEqual(["phone"]);
  });
});

it("never reads the link under the name the profile page does not use", () => {
  expect(readFileSync("features/resume/resume-studio.tsx", "utf8")).not.toContain('text("linkedin")');
  expect(readFileSync("features/resume/resume-from-profile.ts", "utf8")).toContain("link: fit(text(p.link), L.link)");
});

describe("the setup forms start filled in from the profile", () => {
  const step = (which: "education" | "experience", profile: ResumeCareerProfile, track: "student" | "early_career" = "student") =>
    renderToStaticMarkup(
      <ResumeSetup profile={profile} track={track} suggestions={[]} token={async () => null} onSaved={() => {}} step={which} onStep={() => {}} />,
    );

  it("fills the education form with course and institution, marked as still studying", () => {
    expect(studyDraft(filledIn)).toEqual({
      draft: { ...BLANK_STUDY, qualification: "B.Com", institution: "Osmania University", current: true },
      fromProfile: true,
    });
    const html = step("education", filledIn);
    expect(html).toContain('value="B.Com"');
    expect(html).toContain('value="Osmania University"');
    expect(html).toContain("Filled in from your profile.");
  });

  it("fills the work form with role and employer as a job", () => {
    expect(workDraft(filledIn).draft).toEqual({ ...BLANK_WORK, kind: "job", title: "Store associate", organisation: "Lumen Retail" });
    const html = step("experience", filledIn, "early_career");
    expect(html).toContain('value="Store associate"');
    expect(html).toContain('value="Lumen Retail"');
    expect(html).toContain("Filled in from your profile.");
  });

  it("falls back to the internship, then to activities", () => {
    const intern = fromProfilePage({ internshipExperience: "Two months at a call centre", activities: "NSS volunteer" });
    expect(workDraft(intern).draft).toMatchObject({ kind: "internship", detail: "Two months at a call centre" });
    expect(workDraft(fromProfilePage({ activities: "NSS volunteer" })).draft).toMatchObject({ kind: "club", detail: "NSS volunteer" });
  });

  it("opens on the first saved entry, filled in, once there is one - never on empty required fields", () => {
    const withRows = { ...filledIn, education: [{ qualification: "BBA", institution: "St Joseph's", from: "2021", to: "", current: "yes", marks: "8.1" }], experience: [{ kind: "job", title: "Cashier", organisation: "Lumen Retail", detail: "Billed 200 customers a day" }] } as ResumeCareerProfile;
    const edu = step("education", withRows);
    expect(edu).toContain('value="BBA"');
    expect(edu).toContain('value="St Joseph&#x27;s"');
    expect(edu).toContain('value="8.1"');
    expect(edu).toContain(">Save changes<");
    expect(edu).toContain("+ Add another");
    expect(edu).toContain("Editing below");
    expect(edu).not.toContain("Filled in from your profile.");
    const work = step("experience", withRows, "early_career");
    expect(work).toContain('value="Cashier"');
    expect(work).toContain('value="Lumen Retail"');
    expect(work).toContain("Billed 200 customers a day</textarea>");
    expect(work).toContain(">Save changes<");
  });
});

describe("the skills step", () => {
  const skillsStep = (props: { suggestions: string[]; suggestionsForRole?: boolean }, prefs: Record<string, unknown> = filledIn.preferences) =>
    renderToStaticMarkup(
      <ResumeSetup profile={fromProfilePage(prefs)} track="student" token={async () => null} onSaved={() => {}} step="skills" onStep={() => {}} {...props} />,
    );

  it("offers choices even without a target role, labelled as common skills", () => {
    const html = skillsStep({ suggestions: ["Clear communication", "Planning and organising"], suggestionsForRole: false });
    expect(html).toContain("Common skills employers look for");
    expect(html).not.toContain("This role looks for");
    expect(html).toMatch(/<button[^>]*aria-pressed="false"[^>]*>\+ Clear communication<\/button>/);
  });

  it("labels a role's own skills as what the role looks for", () => {
    expect(skillsStep({ suggestions: ["Customer care"], suggestionsForRole: true })).toContain("This role looks for");
  });

  it("does not offer a skill already on the resume", () => {
    const html = skillsStep({ suggestions: ["Hindi", "Planning and organising"], suggestionsForRole: false });
    expect(html).not.toMatch(/aria-pressed="false"[^>]*>\+ Hindi<\/button>/);
    expect(html).toMatch(/aria-pressed="false"[^>]*>\+ Planning and organising<\/button>/);
  });

  it("gives every saved skill its own remove button", () => {
    const html = skillsStep({ suggestions: [] });
    expect(html).toContain("tap × to remove");
    for (const skill of ["Customer service", "Google Sheets", "Hindi"]) {
      expect(html).toContain(`aria-label="Remove ${skill}"`);
    }
  });

  it("removes a skill by saving the rest, and keeps the step open", () => {
    const src = readFileSync("features/resume/resume-setup.tsx", "utf8");
    expect(src).toMatch(/const remaining = skills\.filter\(\(item\) => item\.toLowerCase\(\) !== skill\.toLowerCase\(\)\);\s*await save\(\{ preferences: \{ skills: remaining\.join\(", "\) \} \}, "skills", true\);/);
  });
});

it("the builder passes the backend's suggested skills, falling back to keywords", () => {
  const studio = readFileSync("features/resume/resume-studio.tsx", "utf8");
  expect(studio).toContain("suggestions={target?.suggestedSkills ?? target?.keywords ?? []} suggestionsForRole={Boolean(target?.role)}");
});

describe("saved entries back into the form", async () => {
  const { studyFromRow, workFromRow } = await import("./profile-fields");
  it("reads either way an entry stores 'still here' and the course name", () => {
    expect(studyFromRow({ course: "B.Com", institution: "Osmania University", current: true })).toMatchObject({ qualification: "B.Com", current: true });
    expect(studyFromRow({ qualification: "BBA", current: "yes" }).current).toBe(true);
    expect(studyFromRow({ qualification: "BBA", current: "" }).current).toBe(false);
  });
  it("carries every field the form shows", () => {
    expect(workFromRow({ kind: "job", title: "Cashier", organisation: "Lumen", from: "2024", to: "2025", detail: "Billing", scope: "s", tools: "t", outcome: "o", evidenceSource: "e" }))
      .toEqual({ kind: "job", title: "Cashier", organisation: "Lumen", from: "2024", to: "2025", detail: "Billing", scope: "s", tools: "t", outcome: "o", evidenceSource: "e" });
  });
});

it("saves changes in place, keeps fields the form does not show, and leaves a new entry filled in", () => {
  const src = readFileSync("features/resume/resume-setup.tsx", "utf8");
  expect(src).toContain("eduRows.map((saved, i) => (i === eduAt ? { ...(saved as Row), ...row } : saved))");
  expect(src).toContain("workRows.map((saved, i) => (i === workAt ? { ...(saved as Row), ...row } : saved))");
  expect(src).toContain("setEduAt(eduAt ?? next.length - 1)");
  expect(src).toContain("setWorkAt(workAt ?? next.length - 1)");
});

describe("a step is ticked only when its required fields are filled", async () => {
  const { hasDoneSomething, hasStudied } = await import("./profile-fields");
  const base = { fullName: "Aarav Sharma", phone: "98765 43210", city: "Hyderabad", skills: "Customer care, Hindi, Excel" };

  it("does not tick experience for a role and employer with no 'What you did'", () => {
    const p = fromProfilePage(base);
    const withRole = { ...p, experience: [{ kind: "job", title: "Cashier", organisation: "Lumen Retail", detail: "" }] } as ResumeCareerProfile;
    expect(hasDoneSomething(withRole)).toBe(false);
    expect(setupGaps(withRole).map((g) => g.item)).toContain("experience");
    // The step then opens on that entry, filled in, waiting for what they did.
    const html = renderToStaticMarkup(<ResumeSetup profile={withRole} track="early_career" suggestions={[]} token={async () => null} onSaved={() => {}} step="experience" onStep={() => {}} />);
    expect(html).toContain('value="Cashier"');
    expect(html).toMatch(/placeholder="Describe a responsibility[^"]*"[^>]*><\/textarea>/);
  });

  it("ticks experience once there is a line on what was done", () => {
    const p = { ...fromProfilePage(base), experience: [{ kind: "job", title: "Cashier", organisation: "Lumen Retail", detail: "Billed 200 customers a day" }] } as ResumeCareerProfile;
    expect(hasDoneSomething(p)).toBe(true);
  });

  it("needs both the course and the college to tick education", () => {
    expect(hasStudied(fromProfilePage({ institution: "Osmania University" }))).toBe(false);
    expect(hasStudied(fromProfilePage({ course: "B.Com" }))).toBe(false);
    expect(hasStudied(fromProfilePage({ course: "B.Com", institution: "Osmania University" }))).toBe(true);
  });
});
