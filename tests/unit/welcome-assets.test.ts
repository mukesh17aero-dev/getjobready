// The welcome animation's images actually exist on disk.
//
// This test exists because they once did not. The renderer builds each path by
// concatenation — '/welcome/stills/' + slide.id + '.' + slide.extension — so
// the full filename appears nowhere in the source. A dead-asset sweep that
// matches on filenames sees nothing referencing them, calls them unused, and
// removes them. The page still builds, every route still returns 200, and the
// hero animation is silently blank.
//
// Nothing else catches this: the images are fetched client-side, so they are
// absent from the server HTML too.

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { welcomeSlides } from "@/features/welcome";

const ROOT = process.cwd();
const slides = welcomeSlides.flat() as Array<{
  id: string;
  extension: string;
  label: string;
  detail: string;
  alt: string;
}>;

describe("the welcome hero slides", () => {
  it("covers all three audiences", () => {
    expect(welcomeSlides).toHaveLength(3);
    for (const group of welcomeSlides) expect(group.length).toBeGreaterThan(0);
  });

  it.each(slides.map((s) => [`${s.id}.${s.extension}`, s] as const))(
    "%s is on disk",
    (file) => {
      const full = path.join(ROOT, "public", "welcome", "stills", file);
      expect(fs.existsSync(full), `missing public/welcome/stills/${file}`).toBe(true);
      expect(fs.statSync(full).size).toBeGreaterThan(1024);
    },
  );

  it("gives every slide the copy the caption panel renders", () => {
    for (const slide of slides) {
      expect(slide.label, slide.id).toBeTruthy();
      expect(slide.detail, slide.id).toBeTruthy();
    }
  });

  it("gives every slide alt text, since each one carries meaning", () => {
    for (const slide of slides) {
      expect(slide.alt, slide.id).toBeTruthy();
      expect(slide.alt.length, slide.id).toBeGreaterThan(20);
    }
  });

  it("keeps the renderer building the path this test assumes", () => {
    // If this line changes, the check above is testing the wrong location.
    const renderer = fs.readFileSync(
      path.join(ROOT, "features/welcome/network-welcome-renderer.js"),
      "utf8",
    );
    expect(renderer).toContain("'/welcome/stills/' + slide.id + '.' + slide.extension");
  });
});
