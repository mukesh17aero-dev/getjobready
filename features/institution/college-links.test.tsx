import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { InstitutionLink } from "@/lib/api";
import { CollegeInvitations, CollegeLinksSettings } from "./college-links";
import { NOT_SHARED, SHARED, pastLabel, splitLinks } from "./college-links-model";

const link = (over: Partial<InstitutionLink>): InstitutionLink => ({
  id: "l1", userId: "u", institutionId: "i", institutionName: "St. Xavier's", status: "pending",
  requestedAt: "2026-10-01T00:00:00Z", respondedAt: null, revokedAt: null, ...over,
});

describe("grouping a student's college links", () => {
  it("puts invitations that need an answer first, newest first, and keeps history apart", () => {
    const groups = splitLinks([
      link({ id: "old", status: "pending", requestedAt: "2026-09-01T00:00:00Z" }),
      link({ id: "new", status: "pending", requestedAt: "2026-10-05T00:00:00Z" }),
      link({ id: "on", status: "active" }),
      link({ id: "no", status: "declined" }),
      link({ id: "stop", status: "revoked" }),
    ]);
    expect(groups.pending.map((l) => l.id)).toEqual(["new", "old"]);
    expect(groups.active.map((l) => l.id)).toEqual(["on"]);
    expect(groups.past.map((l) => l.id).sort()).toEqual(["no", "stop"]);
  });

  it("words history in the student's own terms", () => {
    expect(pastLabel(link({ status: "declined" }))).toBe("You declined");
    expect(pastLabel(link({ status: "revoked" }))).toBe("You stopped sharing");
  });
});

describe("what the consent copy promises", () => {
  it("says what a college sees and what it does not, with the sample-size floor the backend enforces", () => {
    expect(SHARED).toMatch(/email address/);
    expect(SHARED).toMatch(/group totals and averages/);
    expect(NOT_SHARED).toMatch(/individual scores/);
    expect(NOT_SHARED).toMatch(/at least 3 students/);
  });
});

describe("before the links load", () => {
  it("shows nothing on Home, so there is no flash of a banner", () => {
    expect(renderToStaticMarkup(<CollegeInvitations />)).toBe("");
  });

  it("explains itself in Settings from the first paint", () => {
    const html = renderToStaticMarkup(<CollegeLinksSettings />);
    expect(html).toContain("Your college");
    expect(html).toContain("Loading");
  });
});
