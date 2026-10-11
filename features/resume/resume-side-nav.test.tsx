import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { ResumeNavButton, ResumeNavFrame } from "./resume-side-nav";
import { SavedResumes } from "./saved-resumes";

// No DOM here, so hover and click are covered by the wiring checks below and
// verified in a browser; these pin the closed state a page first renders.
const render = (current: "new" | "saved" | null) =>
  renderToStaticMarkup(
    <ResumeNavFrame current={current}>
      <h1>Page</h1>
      <ResumeNavButton />
    </ResumeNavFrame>,
  );

const css = readFileSync("features/resume/resume-side-nav.module.css", "utf8");
const src = readFileSync("features/resume/resume-side-nav.tsx", "utf8");

describe("resume side menu", () => {
  it("renders closed, with a labelled button that controls the menu", () => {
    const html = render(null);
    expect(html).toMatch(/<button[^>]*aria-label="Open resume menu"[^>]*aria-expanded="false"/);
    const controls = html.match(/aria-controls="([^"]+)"/)?.[1];
    expect(controls).toBeTruthy();
    expect(html).toMatch(new RegExp(`<nav[^>]*id="${controls}"[^>]*aria-label="Resume"[^>]*data-open="false"`));
  });

  it("offers exactly the two destinations, in order", () => {
    const links = [...render(null).matchAll(/<a[^>]*href="([^"]+)"[^>]*>[\s\S]*?<\/span>([^<]+)<\/a>/g)].map((m) => [m[1], m[2]]);
    expect(links).toEqual([
      ["/resume/build", "Create new resume"],
      ["/resume/saved", "My resumes"],
    ]);
  });

  it("marks the page it is already on, and nothing otherwise", () => {
    expect(render("new")).toMatch(/aria-current="page"[^>]*>[\s\S]*?Create new resume/);
    expect(render("saved")).toMatch(/aria-current="page"[^>]*>[\s\S]*?My resumes/);
    expect(render(null)).not.toContain("aria-current");
  });

  it("draws no button outside a page that has the menu", () => {
    expect(renderToStaticMarkup(<ResumeNavButton />)).toBe("");
  });
});

describe("the menu never hides the page", () => {
  it("is a column of the layout, not an overlay", () => {
    expect(css).not.toMatch(/position:\s*fixed/);
    expect(css).toMatch(/\.frame \{[^}]*display: grid;[^}]*grid-template-columns: 0 minmax\(0, 1fr\);/);
    expect(css).toMatch(/\.frame\[data-open="true"\] \{[^}]*grid-template-columns: 248px minmax\(0, 1fr\);/);
  });

  it("runs the full height of the screen, not just as tall as its links", () => {
    expect(css).toMatch(/\.frame \{[^}]*min-height: 100dvh;/);
    expect(css).toMatch(/\.panel \{[^}]*background: var\(--color-surface\);[^}]*border-right: 1px solid/);
    expect(css).toMatch(/\.panelInner \{[^}]*position: sticky;[^}]*top: 0;[^}]*height: 100dvh;/);
  });

  it("opens above the page on a phone, pushing it down", () => {
    expect(css).toMatch(/@media \(max-width: 759px\)[\s\S]*?\.frame\[data-open="true"\] \{\s*display: block;/);
  });

  it("is hidden from keyboard and screen readers while closed", () => {
    expect(css).toMatch(/\.panel \{[^}]*visibility: hidden;/);
    expect(css).toMatch(/\.panel\[data-open="true"\] \{[^}]*visibility: visible;/);
  });

  it("does not slide for reduced motion, and does not print", () => {
    expect(css).toMatch(/prefers-reduced-motion: reduce[\s\S]*?transition: none/);
    expect(css).toMatch(/@media print \{\s*\.panel \{\s*display: none;/);
  });
});

describe("opening and closing", () => {
  it("opens on a mouse hover after a pause, and on a tap at once", () => {
    expect(src).toMatch(/if \(e\.pointerType !== "mouse" \|\| open\) return;/);
    expect(src).toMatch(/setTimeout\(\(\) => \{[\s\S]*?openNow\(false\);[\s\S]*?\}, HOVER_OPEN_MS\)/);
  });

  it("does not close when the pointer leaves, which would loop as the page moves", () => {
    expect(src).not.toMatch(/onPointerLeave=\{[^}]*close/);
    expect(src).toMatch(/onPointerLeave=\{cancel\}/);
  });

  it("does not close on a click elsewhere, which would shift the page under it", () => {
    expect(src).not.toContain('"pointerdown"');
    expect(src).not.toContain('"mousedown"');
  });

  it("keeps it open when a click follows the hover that opened it", () => {
    expect(src).toMatch(/const justHovered = Date\.now\(\) - hoverOpenedAt\.current < HOVER_CLICK_GRACE_MS;/);
    expect(src).toMatch(/if \(open && !justHovered\) close\(false\);/);
  });

  it("closes on Escape only while focus is in the menu or on its button", () => {
    expect(src).toMatch(/if \(panelRef\.current\?\.contains\(at\) \|\| buttonEl === at\) close\(true\);/);
  });
});

describe("every resume page has the menu beside its title", () => {
  it("the builder", () => {
    const studio = readFileSync("features/resume/resume-studio.tsx", "utf8");
    expect(studio).toMatch(/<div className=\{s\.titleRow\}><ResumeNavButton \/><h1 ref=\{titleRef\}/);
    expect(studio).toMatch(/<ResumeNavFrame current=\{recordAt \? null : "new"\} onNavigate=\{leaveTo\} className=\{s\.navFrame\}><div className=\{s\.canvas\}>/);
    expect(studio).toMatch(/const leaveTo = [\s\S]*?void flush\(\)\.then/);
    // My resumes is in the side menu, and also top right of the page (asked
    // for 2026-10-10) - which saves any edits before it leaves, like the menu.
    expect(studio).toContain('<Link href="/resume/saved" className={s.savedLink} onClick={event => leaveTo("/resume/saved", event)}>');
    expect(studio).not.toMatch(/of \{STAGES\.length\}/);
  });

  it("My resumes", () => {
    const html = renderToStaticMarkup(<SavedResumes profile={null} signedIn={false} />);
    expect(html).toMatch(/aria-label="Open resume menu"[\s\S]*?<h1>My resumes<\/h1>/);
    expect(html).toMatch(/aria-current="page"[^>]*>[\s\S]*?My resumes<\/a>/);
  });

  it("the signed-out builder", () => {
    const guest = readFileSync("features/resume/guest-resume.tsx", "utf8");
    expect(guest).toMatch(/<ResumeNavFrame current="new">/);
    expect(guest).toMatch(/<ResumeNavButton \/><h1 className="[^"]*">[\s\S]*?Show the work you owned\.[\s\S]*?<\/h1>/);
    expect(guest).not.toMatch(/href="\/resume\/saved">My resumes<\/Link>/);
  });
});
