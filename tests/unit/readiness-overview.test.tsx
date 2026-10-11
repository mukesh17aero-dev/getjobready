import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { ReadinessStart } from "@/app/(student)/practice/readiness/start-screen";
import type { AssessableRole } from "@/lib/api";
vi.mock("@/features/assessment", () => ({
  countOf: (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`,
  AssessmentRun: ({ showIntroduction, signedOut, introductionHeader }: { showIntroduction: boolean; signedOut: boolean; introductionHeader: React.ReactNode }) => createElement("section", { "data-overview": showIntroduction, "data-guest": signedOut }, introductionHeader),
}));
const role: AssessableRole = { roleId: "hub_supervisor", roleTitle: "Hub Supervisor", hasAssessment: true, sittings: 0, lastReadiness: null, current: true, chosen: true };
it("opens the approved overview directly with role selection and guest state", () => {
  const html = renderToStaticMarkup(createElement(ReadinessStart, { roles: [role], signedOut: true }));
  expect(html).toContain('data-overview="true"');
  expect(html).toContain('data-guest="true"');
  expect(html).toContain("Choose a role");
  expect(html).not.toContain("View assessment");
  expect(html).not.toContain("begin=1");
});
it("does not launch an unpublished role", () => {
  const html = renderToStaticMarkup(createElement(ReadinessStart, { roles: [{ ...role, hasAssessment: false }] }));
  expect(html).toContain("not published yet");
  expect(html).not.toContain('data-overview="true"');
});
