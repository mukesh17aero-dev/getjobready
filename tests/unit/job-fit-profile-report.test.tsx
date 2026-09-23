import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProfileFitReportView, SAMPLE_JOB_FIT } from "@/features/job-fit";
import { jobFitReturn } from "@/lib/job-fit-return";
import type { JobFitCheck } from "@/lib/api";

const render = (check: JobFitCheck) => renderToStaticMarkup(createElement(ProfileFitReportView, {
  check, profileHref: "/profile?returnTo=%2Fjob-fit%3Fcheck%3Dtest", onCompare() {},
}));

describe("initial profile-fit report", () => {
  it("shows a score, supporting quotes and missing information before any optional preparation", () => {
    const html = render(SAMPLE_JOB_FIT);
    expect(html).toContain("Profile fit for this job");
    expect(html).toContain("Handled customer complaints");
    expect(html).toContain("Not evidenced yet");
    expect(html).toContain("Optional next steps");
    expect(html).not.toContain("Mark my answers");
    expect(html.indexOf("Profile fit for this job")).toBeLessThan(html.indexOf("Optional next steps"));
  });
  it("never renders zero as an ability score for an empty profile", () => {
    const html = render({ ...SAMPLE_JOB_FIT, profileFit: { ...SAMPLE_JOB_FIT.profileFit!, score: null, mode: "needs_profile" } });
    expect(html).toContain("No score yet");
    expect(html).toContain("Add my profile or resume");
    expect(html).toContain("returnTo=%2Fjob-fit%3Fcheck%3Dtest");
    expect(html).not.toContain("Optional next steps");
  });
  it("allows an AI failure to be retried without forcing practice", () => {
    const html = render({ ...SAMPLE_JOB_FIT, profileFit: { ...SAMPLE_JOB_FIT.profileFit!, score: null, mode: "analysis_unavailable" } });
    expect(html).toContain("Retry profile comparison");
    expect(html).toContain("unreviewed, not a list of skills you lack");
  });
  it("does not relabel legacy practice-based scores as current profile fit", () => {
    const html = render({ ...SAMPLE_JOB_FIT, profileFit: null });
    expect(html).toContain("earlier readiness method");
    expect(html).not.toContain(" / 100");
  });
  it("escapes profile text rather than interpreting it as markup", () => {
    const report = structuredClone(SAMPLE_JOB_FIT.profileFit!);
    report.requirements[0]!.facets[0]!.quote = '<script>alert("test")</script>';
    const html = render({ ...SAMPLE_JOB_FIT, profileFit: report });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
  it("returns only to a local job-fit screen after profile editing", () => {
    expect(jobFitReturn("/job-fit?opportunity=job-1")).toBe("/job-fit?opportunity=job-1");
    expect(jobFitReturn("/job-fit?check=abc")).toBe("/job-fit?check=abc");
    for (const url of ["https://evil.test", "//evil.test", "/job-fit/../admin", "/job-fit\\evil", null]) expect(jobFitReturn(url)).toBeNull();
  });
});
