import { describe, it, expect } from "vitest";
import { storySoFar } from "@/features/journey";
import type { ProfileFields } from "@/features/profile";
import type { JourneyState } from "@/lib/api";

const fields = (over: Partial<ProfileFields>) => ({ city: "dddd", ...over }) as ProfileFields;
const state = (over: Partial<JourneyState> & { selectedRole?: string | null; roleTitle?: string } = {}): JourneyState => ({
  routes: [],
  current: null,
  progress: {
    told: 3, name: "Varun", track: null, discoveryDone: true,
    selectedRole: over.selectedRole ?? null,
    role: over.roleTitle ? { id: "csa", title: over.roleTitle, pitch: "", payMonthly: null, next: null } : null,
  },
  modules: over.modules,
});

describe("story so far", () => {
  it("never repeats the city or says 'none', and keeps interests to two", () => {
    const story = storySoFar(
      state({ selectedRole: "none", modules: { readiness: "done", jobFit: "done" } }),
      fields({ currentRole: "Customer Support Associate", interestedSpaces: "E-commerce, Banking, Retail, Logistics, Healthcare, Hospitality" }),
    );
    expect(story.who).toBe(
      "You are working as a Customer Support Associate. No role chosen yet. You are drawn to E-commerce, Banking and 4 more. So far you have checked your readiness and run a job-fit check.",
    );
  });

  it("names the role once one is chosen, and leaves out progress there is none of", () => {
    const story = storySoFar(state({ selectedRole: "csa", roleTitle: "Customer Success Associate" }), fields({ currentRole: "Customer Support Associate", interestedSpaces: "E-commerce" }));
    expect(story.who).toBe("You are working as a Customer Support Associate. You are aiming for Customer Success Associate.");
  });
});
