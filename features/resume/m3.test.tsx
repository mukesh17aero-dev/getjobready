import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

// Material 3 is the resume builder's look, scoped to the builder.
const read = (f: string) => readFileSync(f, "utf8");

describe("Material 3 in the resume builder", () => {
  it("roots every builder page in the Material palette and Roboto", () => {
    expect(read("features/resume/m3.ts")).toContain("export const M3_ROOT = `${s.m3} ${roboto.variable}`;");
    expect(read("features/resume/resume-studio.tsx")).toContain("className={`${s.shell} ${M3_ROOT}`}");
    // My resumes and the signed-out builder wear it too.
    expect(read("features/resume/saved-resumes.tsx")).toContain("className={`${s.page} ${M3_ROOT}`}");
    expect(read("features/resume/guest-resume.tsx")).toContain("${M3_ROOT}`}");
  });

  it("takes every colour from the app's own palette, so the builder matches other pages in both themes", () => {
    const css = read("features/resume/m3.module.css");
    const roles = [...css.matchAll(/^\s+(--m3-(?!elev)[a-z-]+):\s*([^;]+);/gm)];
    expect(roles.length).toBeGreaterThan(10);
    for (const [, role, value] of roles) {
      if (role === "--m3-on-primary") expect(value).toBe("#ffffff");
      else expect(value, role).toMatch(/^var\(--color-[a-z0-9-]+\)$/);
    }
    // No Material-generated tints, no separate dark set, and the app's tokens are read, never redefined.
    expect(css).not.toMatch(/#(f4fbf8|eef5f2|cce8e2|9ef2e6)/i);
    expect(css).not.toContain("prefers-color-scheme");
    // The only app colours redefined in the builder are its green tints, each turned neutral.
    const redefined = [...css.matchAll(/^\s+(--color-[a-z0-9-]+):\s*([^;]+);/gm)].map((m) => [m[1], m[2]]);
    expect(redefined.map(([name]) => name).sort()).toEqual(["--color-teal-50", "--color-teal-900", "--color-violet-100", "--color-violet-50", "--color-violet-900"]);
    for (const [, value] of redefined) expect(value).toMatch(/^var\(--color-(slate-(100|200)|brand-ink)\)$/);
    expect(read("app/globals.css")).not.toContain("--m3-");
  });

  it("writes button text on the primary colour through the on-primary role, not a fixed white class", () => {
    for (const f of ["features/resume/resume-setup.tsx", "features/resume/guest-resume.tsx", "features/resume/essentials-modal.tsx", "features/resume/review-progress.tsx"]) {
      expect(read(f)).not.toMatch(/bg-(brand-violet|brand-teal-deep|teal-700)[^"`]*text-white|text-white[^"`]*bg-(brand-violet|brand-teal-deep|teal-700)/);
    }
  });
});

it("lets the app's own background and gradient show behind the builder, as on every other page", () => {
  const css = readFileSync("features/resume/resume-studio.module.css", "utf8");
  // Every rule whose selector is exactly .shell (comments ignored), in order.
  const shellRules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter((m) => m[1]!.replace(/\/\*[\s\S]*?\*\//g, "").trim() === ".shell")
    .map((m) => m[2]!);
  // The last word on the shell's background is transparent.
  expect(shellRules.filter((r) => r.includes("background")).at(-1)).toBe("background:transparent");
});

it("lays Your details out as one column, so no empty column sits where a preview used to be", () => {
  const css = readFileSync("features/resume/resume-studio.module.css", "utf8");
  // The last rule for the setup grid, and the most specific one, is a single column.
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((m) => /setupGrid\s*$/.test(m[1]!.replace(/\/\*[\s\S]*?\*\//g, "").trim()));
  expect(rules.at(-1)?.[1]?.trim().endsWith(".shell .setupGrid")).toBe(true);
  expect(rules.at(-1)?.[2]).toBe("grid-template-columns:minmax(0,1fr)");
});

it("leaves no green-tinted shadows, and highlights edits in coral rather than a green wash", () => {
  const studio = readFileSync("features/resume/resume-studio.module.css", "utf8");
  for (const green of ["#1c373210", "#21433c0a", "#214b430c", "#43887a0b", "#48a99625"]) expect(studio).not.toContain(green);
  const bench = readFileSync("features/resume/resume-workbench.module.css", "utf8");
  expect(bench).toMatch(/\.paper \[data-editing\]\{background:color-mix\(in srgb,var\(--color-brand-accent\)/);
});
