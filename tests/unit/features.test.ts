import { describe, expect, it } from "vitest";
import { CATEGORIES, isOpen, STATUS_LABEL } from "@/features/welcome";

// The landing pages list things that are not built yet on purpose, so the one
// rule that must never break is that an unbuilt feature cannot be opened. A
// card that looks live and goes nowhere is worse than no card at all.

const everyFeature = Object.values(CATEGORIES).flatMap((c) =>
  c.features.map((f) => [c.id, f] as const),
);

describe("feature catalogue", () => {
  it("gives every category a stake and at least one feature", () => {
    for (const category of Object.values(CATEGORIES)) {
      expect(category.stake.length).toBeGreaterThan(20);
      expect(category.features.length).toBeGreaterThan(0);
    }
  });

  it("only lets a live feature be opened", () => {
    for (const [categoryId, feature] of everyFeature) {
      const where = `${categoryId}/${feature.id}`;
      if (feature.status === "live") {
        expect(feature.href, `${where} is live and needs a href`).not.toBeNull();
        expect(isOpen(feature), `${where} should open`).toBe(true);
      } else {
        // The important half: nothing unreleased may carry a destination, so
        // there is no path by which it renders an "Open" button.
        expect(feature.href, `${where} is not live and must go nowhere`).toBeNull();
        expect(isOpen(feature), `${where} must not open`).toBe(false);
      }
    }
  });

  it("gives every feature all three answers the detail panel shows", () => {
    for (const [categoryId, feature] of everyFeature) {
      const where = `${categoryId}/${feature.id}`;
      expect(feature.about.length, `${where} about`).toBeGreaterThan(20);
      expect(feature.forWho.length, `${where} forWho`).toBeGreaterThan(20);
      expect(feature.expect.length, `${where} expect`).toBeGreaterThan(20);
    }
  });

  it("never puts a time estimate on something nobody can start", () => {
    for (const [categoryId, feature] of everyFeature) {
      if (feature.status !== "live") {
        expect(feature.time, `${categoryId}/${feature.id}`).toBeNull();
      }
    }
  });

  it("keeps each category's first feature the one that is built", () => {
    // The panel opens on features[0], and opening on something unreleased
    // would make the page look emptier than it is.
    for (const category of Object.values(CATEGORIES)) {
      if (category.features.some(isOpen)) {
        expect(category.features[0].status, category.id).toBe("live");
      }
    }
  });

  it("labels every status in words a person would use", () => {
    expect(STATUS_LABEL.live).toBe("Available now");
    expect(STATUS_LABEL.building).toBe("In development");
    expect(STATUS_LABEL.planned).toBe("Not released yet");
  });
});
