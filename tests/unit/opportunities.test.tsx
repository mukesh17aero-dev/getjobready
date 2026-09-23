import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OpportunityList } from "@/features/opportunities";
import type { Opportunity } from "@/lib/api";

const job = (over: Partial<Opportunity> = {}): Opportunity => ({
  id: "job-1",
  title: "Customer Support Associate",
  company: "Example Co",
  location: "Bengaluru",
  type: "Full-time",
  openings: 3,
  salary: "18000-22000",
  description: "Handle inbound customer queries.",
  requirements: "",
  skills: "voice, chat",
  experience: "Fresher",
  shift: "Day shift",
  languages: "English, Hindi",
  publishedAt: "2026-09-01T00:00:00Z",
  applyUrl: "https://newera.example/candidate.html?apply=job-1",
  ...over,
});

const render = (opportunities: Opportunity[], status: "fetched" | "not_configured" | "unavailable" = "fetched") =>
  renderToStaticMarkup(createElement(OpportunityList, { opportunities, status }));

describe("Opportunities list", () => {
  it("renders a real listing with a working apply link, never inventing a match score", () => {
    const html = render([job()]);
    expect(html).toContain("Example Co");
    expect(html).toContain("Customer Support Associate");
    expect(html).toContain("Bengaluru");
    expect(html).toContain('href="https://newera.example/candidate.html?apply=job-1"');
    expect(html).toContain("Apply on NewEra");
    expect(html).not.toMatch(/\d+%\s*match/i);
  });

  it("says plainly when nothing is connected, rather than showing an empty grid", () => {
    const html = render([], "not_configured");
    expect(html).toContain("not connected yet");
  });

  it("distinguishes a fetch failure from a genuinely empty list", () => {
    expect(render([], "unavailable")).toContain("could not load");
    expect(render([], "fetched")).toContain("No openings are published right now");
  });

  it("omits a field entirely rather than showing it empty", () => {
    const html = render([job({ salary: "", shift: "" })]);
    expect(html).not.toContain(">Pay<");
    expect(html).not.toContain(">Shift<");
    expect(html).toContain(">Skills<");
  });

  it("names an unnamed employer rather than leaving a blank line", () => {
    const html = render([job({ company: "" })]);
    expect(html).toContain("Employer not named");
  });

  it("points every listing at practice, honestly labelled as general rather than matched to that one job", () => {
    const html = render([job()]);
    expect(html).toContain('href="/practice"');
    expect(html).toContain("Practice before you apply");
    expect(html).toContain("Not matched to this exact opening");
  });
});
