import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { JourneyOverview } from "./journey-overview";
import type { LearningJourneySummary } from "@/lib/api/simulation-journey";
const journeys: LearningJourneySummary[] = [
  { roleId: "one", title: "First practice", description: "First description", version: 1, steps: 4, durationSeconds: 600, completed: 0, status: "Not started" },
  { roleId: "two", title: "Saved practice", description: "Your selected workplace", version: 1, steps: 7, durationSeconds: 1200, completed: 3, status: "In progress" },
];
it("shows saved-role facts and only one launch action", () => {
  const html = renderToStaticMarkup(createElement(JourneyOverview, { journeys, initialRole: "two", busy: false, onOpen: () => {} }));
  expect(html).toContain("Your selected workplace");
  expect(html).toContain("7 activities");
  expect(html).toContain("3 completed");
  expect(html).toContain("Continue practice →");
  expect(html.match(/<button/g)).toHaveLength(1);
});
it("falls back to an available practice and prevents repeat launches while busy", () => {
  const html = renderToStaticMarkup(createElement(JourneyOverview, { journeys, initialRole: "unpublished", busy: true, onOpen: () => {} }));
  expect(html).toContain("First description");
  expect(html).toContain("Opening…");
  expect(html).toContain('disabled=""');
});
