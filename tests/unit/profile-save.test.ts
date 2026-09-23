import { describe, expect, it } from "vitest";
import { profileSavePayload } from "@/features/profile";
import { emptyEducation, emptyExperience, toFields } from "@/features/profile";
import type { CareerProfile } from "@/lib/api";

describe("saving the sectioned profile", () => {
  const previous: CareerProfile = {
    version: 1, createdAt: "2026-09-10T10:00:00Z",
    education: [], experience: [], projects: [{ title: "Existing project" }], achievements: [],
    preferences: { fullName: "Asha Rao", resumeLedger: [{ at: "yesterday", role: "Support", resume: { summary: "Saved work" } }], resumeExtras: { phone: "kept" }, storySummary: "Old story" },
  };
  it("keeps saved resume versions and unrelated preferences when editing basics", () => {
    const payload = profileSavePayload(previous, { ...toFields(previous), city: "Chennai" }, [], [], null);
    expect(payload.preferences.resumeLedger).toEqual(previous.preferences.resumeLedger);
    expect(payload.preferences.resumeExtras).toEqual(previous.preferences.resumeExtras);
    expect(payload.preferences.city).toBe("Chennai");
    expect(payload.projects).toEqual(previous.projects);
    expect(payload.preferences.storySummary).toBeNull();
  });
  it("saves the edited histories instead of restoring the old record's arrays", () => {
    const education = { ...emptyEducation(), qualification: "B.Com", institution: "City College" };
    const experience = { ...emptyExperience(), title: "Support associate", organisation: "Example", detail: "Handled support questions" };
    const payload = profileSavePayload(previous, toFields(previous), [education, emptyEducation()], [experience, emptyExperience()], null);
    expect(payload.education).toHaveLength(1);
    expect(payload.experience).toHaveLength(1);
    expect(JSON.stringify(payload.education)).toContain("City College");
    expect(JSON.stringify(payload.experience)).toContain("Support associate");
    expect(previous.education).toEqual([]);
  });
});
