import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ProductNavigation } from "./product-navigation";

// The main navigation: each area, and beneath it the pages inside it - the
// area they are in opens on its own, the rest open with their chevron.

const nav = (pathname: string) => renderToStaticMarkup(<ProductNavigation pathname={pathname} />);
const list = (html: string, label: string) => {
  const area = html.slice(html.indexOf(`aria-label="${label}"`));
  return area.slice(area.indexOf("<ul"), area.indexOf("</ul>") + 5);
};

describe("the main navigation", () => {
  it("lists the pages under Apply - and opens them when you are in Apply", () => {
    const html = nav("/resume/build");
    const apply = list(html, "Apply");
    expect(apply).not.toContain("hidden");
    for (const page of ["Resume", "LinkedIn profile", "Job fit"]) expect(apply).toContain(`>${page}</a>`);
    // One Resume entry, not two.
    expect(apply).not.toContain(">My resumes</a>");
    const resume = apply.match(/<a[^>]*href="\/resume\/build"[^>]*>/)?.[0] ?? "";
    expect(resume).toContain('aria-current="page"');
  });

  it("keeps other areas' pages closed, behind a chevron that says what it opens", () => {
    const html = nav("/resume/build");
    expect(list(html, "Practice")).toContain("hidden");
    expect(html).toMatch(/aria-expanded="false"[^>]*aria-label="Show Practice pages"/);
    expect(html).toMatch(/aria-expanded="true"[^>]*aria-label="Hide Apply pages"/);
  });

  it("gives Practice its five pages, and lists Saved roles once - in Your space", () => {
    const html = nav("/practice/missions");
    for (const page of ["Readiness check", "Simulations", "AI interview", "Roleplay", "Interview questions"]) expect(list(html, "Practice")).toContain(`>${page}</a>`);
    expect(html.match(/>Saved roles</g)).toHaveLength(1);
  });
});

it("keeps Resume current on My resumes too", () => {
  const html = renderToStaticMarkup(<ProductNavigation pathname="/resume/saved" />);
  const area = html.slice(html.indexOf('aria-label="Apply"'));
  const resume = area.match(/<a[^>]*href="\/resume\/build"[^>]*>/)?.[0] ?? "";
  expect(resume).toContain('aria-current="page"');
});

it("gives Explore no sub-pages: one entry, no chevron", () => {
  const html = renderToStaticMarkup(<ProductNavigation pathname="/discover" />);
  expect(html).not.toContain("Explore pages");
  expect(html).not.toContain(">Find a role</a>");
});

it("has no My journey page under Home", () => {
  const html = renderToStaticMarkup(<ProductNavigation pathname="/" />);
  expect(html).not.toContain("/journey");
  expect(html).not.toContain("Home pages");
});
