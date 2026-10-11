import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PracticeLanding } from "./practice-landing";

const base = { role: "Operations Executive", roleId: "operations_executive", available: false, unavailable: false, course: null, assessment: null };
describe("practice landing", () => {
  it("keeps an unavailable role and offers the catalogue without substituting a role", () => {
    const html = renderToStaticMarkup(<PracticeLanding {...base} />);
    expect(html).toContain("Operations Executive missions aren’t available yet.");
    expect(html).toContain('href="/practice/missions"');
    expect(html).not.toContain("/practice/missions?role=");
    expect(html).not.toContain(" / 100");
  });
  it("distinguishes an unavailable service from unpublished missions", () => {
    const html = renderToStaticMarkup(<PracticeLanding {...base} unavailable />);
    expect(html).toContain("couldn’t check practice availability");
    expect(html).not.toContain("missions aren’t available yet");
  });
  it("preserves a measured zero and links available practice to the exact role", () => {
    const html = renderToStaticMarkup(<PracticeLanding {...base} available assessment={{score:0,title:base.role,basis:"5 of 5 situations",confidence:"low",date:"05/10/2026"}} />);
    expect(html).toContain('href="/practice/missions?role=operations_executive"');
    expect(html).toContain("0 / 100");
    expect(html).toContain("5 of 5 situations");
    expect(html).toContain("low confidence");
  });
});
