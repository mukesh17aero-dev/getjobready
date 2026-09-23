// The shape of the codebase, asserted.
//
// The architecture guard (scripts/check-architecture.mjs) runs before typecheck
// and build, so it already fails the gate. These tests cover the things the
// guard cannot see: that the guard itself still works, and that a new file
// cannot quietly go missing from the barrel that is supposed to expose it.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");
const SELF = path.join("tests", "unit", "module-structure.test.ts");

const runGuard = () => {
  try {
    execFileSync("node", ["scripts/check-architecture.mjs"], { cwd: ROOT, stdio: "pipe" });
    return { ok: true, output: "" };
  } catch (e) {
    const err = e as { stdout?: Buffer; stderr?: Buffer };
    return { ok: false, output: `${err.stdout ?? ""}${err.stderr ?? ""}` };
  }
};

describe("the architecture guard", () => {
  const planted: string[] = [];
  afterEach(() => {
    for (const f of planted.splice(0)) fs.rmSync(path.join(ROOT, f), { force: true });
  });

  it("passes on the codebase as it stands", () => {
    expect(runGuard().ok).toBe(true);
  });

  it("catches a component reaching past a feature's barrel", () => {
    const f = "components/ui/__guard-probe.tsx";
    planted.push(f);
    // built at runtime: a literal deep-import path in this file would itself
    // be a violation, and the guard is right to say so.
    const deep = ["@", "features", "resume", "resume-builder"].join("/");
    fs.writeFileSync(path.join(ROOT, f),
      `import { ResumeBuilder } from "${deep}";\nexport const Probe = () => ResumeBuilder;\n`);
    const { ok, output } = runGuard();
    expect(ok).toBe(false);
    // components/ may not import features/ at all, and this is also a deep import
    expect(output).toMatch(/layer-direction|feature-barrel/);
  });

  it("catches lib reaching up into a feature", () => {
    const f = "lib/__guard-probe.ts";
    planted.push(f);
    const up = ["@", "features", "resume"].join("/");
    fs.writeFileSync(path.join(ROOT, f), `export type { PlanId } from "${up}";\n`);
    const { ok, output } = runGuard();
    expect(ok).toBe(false);
    expect(output).toContain("layer-direction");
  });

  it("catches a sync-conflict copy left in the tree", () => {
    const f = "lib/when 2.ts";
    planted.push(f);
    fs.writeFileSync(path.join(ROOT, f), "export const stale = true;\n");
    const { ok, output } = runGuard();
    expect(ok).toBe(false);
    expect(output).toContain("duplicate-file");
  });

  it("catches a new file over the size limit", () => {
    const f = "lib/__guard-big.ts";
    planted.push(f);
    fs.writeFileSync(path.join(ROOT, f), Array.from({ length: 900 }, (_, i) => `export const n${i} = ${i};`).join("\n"));
    const { ok, output } = runGuard();
    expect(ok).toBe(false);
    expect(output).toContain("file-too-large");
  });
});

describe("feature barrels", () => {
  const features = fs.readdirSync(path.join(ROOT, "features"))
    .filter((d) => fs.statSync(path.join(ROOT, "features", d)).isDirectory());

  it("finds every feature", () => {
    expect(features.length).toBeGreaterThanOrEqual(12);
  });

  it.each(features)("%s exposes a public surface", (feature) => {
    const barrel = path.join("features", feature, "index.ts");
    expect(fs.existsSync(path.join(ROOT, barrel))).toBe(true);
    const text = read(barrel);
    // either it re-exports something, or it says out loud that it exposes nothing
    expect(text.includes("export * from") || text.includes("export {")).toBe(true);
  });

  it.each(features)("%s is entered only through its barrel", (feature) => {
    const outside: string[] = [];
    const walk = (dir: string) => {
      for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
        if (["node_modules", ".next", ".git"].includes(e.name)) continue;
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        // this file quotes deep-import paths as probe fixtures; it is not a caller
        else if (/\.tsx?$/.test(e.name) && p !== SELF && !p.startsWith(path.join("features", feature))) {
          const m = read(p).match(new RegExp(`@/features/${feature}/[A-Za-z0-9._/-]+`, "g"));
          for (const hit of m ?? []) if (!hit.endsWith(".css")) outside.push(`${p}: ${hit}`);
        }
      }
    };
    for (const dir of ["app", "components", "features", "lib", "tests"]) walk(dir);
    expect(outside).toEqual([]);
  });
});

describe("the API client barrel", () => {
  const dir = path.join(ROOT, "lib/api");
  const parts = fs.readdirSync(dir).filter((f) => f.endsWith(".ts") && f !== "index.ts");
  const barrel = read("lib/api/index.ts");

  it("splits the backend contract into one file per module", () => {
    expect(parts.length).toBeGreaterThanOrEqual(10);
  });

  it.each(parts)("re-exports %s, so no part is orphaned", (part) => {
    expect(barrel).toContain(`"./${part.replace(/\.ts$/, "")}"`);
  });

  it("keeps every part under the size limit", () => {
    for (const p of parts) {
      expect(fs.readFileSync(path.join(dir, p), "utf8").split("\n").length).toBeLessThanOrEqual(800);
    }
  });
});
