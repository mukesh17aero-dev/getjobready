import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// Text has to be readable: at least 12px, and never the light greys that fall
// under the 4.5:1 contrast standard on white (slate-300/400 ~2.6:1). Exempt:
// the resume document itself, drawn at true print size and scaled down, and
// the miniature thumbnails of it.
const EXEMPT_FILES = ["features/resume/resume-sheet.tsx", "features/resume/resume-print-document.tsx"];
const MINIATURE = /mini|thumb|lookSheet|templatePreview|paper|sheet/i;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(tsx|ts|css)$/.test(name) && !name.includes(".test.") ? [path] : [];
  });
}
const all = ["app", "features", "components"].flatMap(files).filter((f) => !EXEMPT_FILES.includes(f));
const px = (v: string, unit: string) => parseFloat(v) * (unit === "rem" ? 16 : 1);

describe("readable text across the app", () => {
  it("has no Tailwind text below 12px", () => {
    const small = all.flatMap((f) => [...read(f).matchAll(/text-\[(\d*\.?\d+)(rem|px)\]/g)].filter((m) => px(m[1]!, m[2]!) < 12).map((m) => `${f}: ${m[0]}`));
    expect(small).toEqual([]);
  });

  it("has no stylesheet text below 12px, outside miniature thumbnails", () => {
    const small = all.filter((f) => f.endsWith(".css")).flatMap((f) =>
      [...read(f).matchAll(/([^{}]+)\{([^{}]*)\}/g)]
        .filter((m) => !m[1]!.trim().startsWith("@") && !MINIATURE.test(m[1]!))
        .flatMap((m) => [...m[2]!.matchAll(/font-size:\s*(\d*\.?\d+)(px|rem)/g)].filter((s) => px(s[1]!, s[2]!) < 12).map((s) => `${f}: ${m[1]!.trim().slice(-40)} ${s[0]}`)),
    );
    expect(small).toEqual([]);
  });

  it("uses no light grey or faint translucent text", () => {
    const light = all.flatMap((f) => {
      const s = read(f);
      return [
        ...[...s.matchAll(/(?:[a-z-]+:)?text-slate-(?:300|400)\b/g)].map((m) => `${f}: ${m[0]}`),
        ...[...s.matchAll(/(?<![\w-])color:\s*var\(--color-slate-(?:300|400)\)/g)].map((m) => `${f}: ${m[0]}`),
        ...[...s.matchAll(/text-(?:white|black|brand-ink|slate-\d+)\/(\d+)\b/g)].filter((m) => Number(m[1]) < 60).map((m) => `${f}: ${m[0]}`),
      ];
    });
    expect(light).toEqual([]);
  });
});

function read(f: string) {
  return readFileSync(f, "utf8");
}
