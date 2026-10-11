import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OpportunityDetail, OpportunityList } from "@/features/opportunities";
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
  experienceBands: ["0-1"],
  shift: "Day shift",
  languages: "English, Hindi",
  publishedAt: "2026-09-01T00:00:00Z",
  applyUrl: "https://newera.example/candidate.html?apply=job-1",
  ...over,
});

const render = (opportunities: Opportunity[], status: "fetched" | "not_configured" | "unavailable" = "fetched") =>
  renderToStaticMarkup(createElement(OpportunityList, { opportunities, status }));

describe("Opportunities list", () => {
  it("routes a listing to details before an external application, never inventing a match score", () => {
    const html = render([job()]);
    expect(html).toContain("Example Co");
    expect(html).toContain("Customer Support Associate");
    expect(html).toContain("Bengaluru");
    expect(html).toContain('href="/opportunities/job-1"');
    expect(html).toContain("View job details");
    expect(html).not.toContain("Apply on NewEra");
    expect(html).not.toMatch(/\d+%\s*match/i);
  });

  it("shows requirements and the actual feed-check timestamp before applying", () => {
    const html = renderToStaticMarkup(createElement(OpportunityDetail, { job: job({ requirements: "Weekend availability required", lastCheckedAt: "2026-10-03T12:30:00Z" }) }));
    expect(html).toContain("Weekend availability required");
    expect(html).toContain('dateTime="2026-10-03T12:30:00Z"');
    expect(html).toContain('href="https://newera.example/candidate.html?apply=job-1"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("says plainly when nothing is connected, rather than showing an empty grid", () => {
    const html = render([], "not_configured");
    expect(html).toContain("not connected yet");
  });

  it("distinguishes a fetch failure from a genuinely empty list", () => {
    expect(render([], "unavailable")).toContain("could not load");
    expect(render([], "unavailable")).toContain("Retry loading jobs");
    expect(render([], "unavailable")).toContain("Return to Home");
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

  it("carries the exact listing identity into profile fit without requiring practice", () => {
    const html = render([job()]);
    expect(html).toContain('href="/job-fit?opportunity=job-1"');
    expect(html).toContain("See my profile fit");
    expect(html).toContain("No practice is required");
  });
});

it("does not label an unclassified job as a fresher opening", () => {
  const html = render([job({ title: "Unclassified vacancy", experienceBands: [] })]);
  expect(html).not.toContain("Unclassified vacancy");
  expect(html).toContain("No jobs match this filter");
  expect(html).toContain("All experience levels");
});
