import { describe, it, expect } from "vitest";
import { firstStepFor, setupGaps, type ResumeCareerProfile } from "@/features/resume";

const empty: ResumeCareerProfile = { version: 1, createdAt: "", education: [], experience: [], projects: [], achievements: [], preferences: {} };

describe("resume setup gaps", () => {
  it("names every gap on an empty record and opens the first step", () => {
    const gaps = setupGaps(empty);
    expect(gaps.map((g) => g.item)).toEqual(["name", "phone", "city", "education", "experience", "skills"]);
    expect(firstStepFor(gaps)).toBe("about");
  });

  it("is complete with the core set, a college project counting as something done", () => {
    const full: ResumeCareerProfile = {
      ...empty,
      education: [{ qualification: "B.Com", institution: "Osmania University" }],
      experience: [{ kind: "project", title: "Fest registration desk", detail: "Checked in 400 visitors" }],
      preferences: { fullName: "Aarav Sharma", phone: "98765 43210", city: "Hyderabad", skills: "Customer service, Google Sheets, Hindi" },
    };
    expect(setupGaps(full)).toEqual([]);
    expect(firstStepFor([])).toBeNull();
  });

  it("sends a record missing only skills to the skills step", () => {
    const gaps = setupGaps({
      ...empty,
      education: [{ qualification: "B.Com", institution: "Osmania University" }],
      experience: [{ title: "Tutoring", detail: "Taught two Class X students" }],
      preferences: { fullName: "Aarav Sharma", phone: "9876543210", city: "Hyderabad", skills: "Excel, excel" },
    });
    expect(firstStepFor(gaps)).toBe("skills");
  });
});
