import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Page from "@/app/(public)/passport/[token]/page";

const api = vi.hoisted(() => ({ getSharedPassport: vi.fn() }));
vi.mock("@/lib/api", () => api);

const overview = {
  version: "passport-overview-v1", generatedAt: "2026-09-23T09:00:00Z", mode: "candidate_preview" as const,
  role: { id: "role-1", title: "Customer Success Associate" },
  candidate: { state: "available" as const, data: { name: "Aarav Mehta", summary: null, location: null, education: [], experience: [] } },
  sources: { journey: "pending" as const, assessments: "pending" as const, training: "pending" as const, interviews: "pending" as const },
  journey: [], skills: [], training: [], interviews: [], evidence: [],
  summary: { completedModules: 0, totalModules: 6, assessedSkills: 0, evidenceCount: 0 },
  sharing: { enabled: true, active: { token: "tok", expiresAt: "2026-10-20T00:00:00Z" }, reason: "x" },
  limitations: [],
};

beforeEach(() => vi.clearAllMocks());

async function render(token = "tok") {
  return renderToStaticMarkup(await Page({ params: Promise.resolve({ token }) }));
}

describe("public Passport share page", () => {
  it("shows a plain explanation, not an error page, when the link does not resolve", async () => {
    api.getSharedPassport.mockResolvedValue(null);
    const html = await render();
    expect(html).toContain("This link is not available");
    expect(html).toContain("expired");
    expect(api.getSharedPassport).toHaveBeenCalledWith("tok");
  });

  it("renders the frozen overview with no share controls for a visitor", async () => {
    api.getSharedPassport.mockResolvedValue({ overview });
    const html = await render();
    expect(html).toContain("Aarav Mehta");
    expect(html).toContain("Customer Success Associate");
    expect(html).toContain("A private snapshot, shared by the candidate");
    expect(html).not.toContain("Revoke link");
    expect(html).not.toContain("Share this passport");
  });

  it("falls back to an honest placeholder when the candidate's name is not on record", async () => {
    api.getSharedPassport.mockResolvedValue({ overview: { ...overview, candidate: { state: "pending" as const, data: null } } });
    const html = await render();
    expect(html).toContain("This candidate");
  });
});
