#!/usr/bin/env node
// Architecture guard for the Ascend frontend.
//
// These are the rules CLAUDE.md states in prose, checked mechanically so they
// cannot rot again. Run by `npm run check:arch`, and by lint/typecheck/build.
//
// Every failure prints the offending file and the rule it broke. If a rule is
// genuinely wrong for a case, change the rule here and in CLAUDE.md in the same
// commit — do not add a silent exception.

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SKIP = new Set(["node_modules", ".next", ".git", ".vercel", "certificates", "public"]);
const CODE = /\.(tsx?|jsx?|mjs)$/;
const STYLE = /\.(css)$/;

const walk = (dir, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};
const rel = (f) => path.relative(ROOT, f).split(path.sep).join("/");

const files = walk(ROOT).filter((f) => CODE.test(f) || STYLE.test(f)).map(rel)
  .filter((f) => /^(app|components|features|lib|tests)\//.test(f));

const problems = [];
const fail = (file, rule, detail) => problems.push({ file, rule, detail });

// Which layer does a path belong to, and which feature owns it?
const layerOf = (f) => f.split("/")[0];
const featureOf = (f) => (f.startsWith("features/") ? f.split("/")[1] : null);

// What a layer is allowed to import from.
const ALLOWED = {
  app: new Set(["app", "features", "components", "lib"]),
  features: new Set(["features", "components", "lib"]),
  components: new Set(["components", "lib"]),
  lib: new Set(["lib"]),
  tests: new Set(["app", "features", "components", "lib", "tests"]),
};

const IMPORT = /(?:from\s*|import\s*\(\s*|require\(\s*|@import\s*(?:url\(\s*)?|import\s+)['"]([^'"]+)['"]/g;
const edges = new Map(); // feature -> Set(feature)

for (const f of files) {
  const src = fs.readFileSync(path.join(ROOT, f), "utf8");
  const myLayer = layerOf(f);
  const myFeature = featureOf(f);

  for (const m of src.matchAll(IMPORT)) {
    const spec = m[1];
    if (!spec.startsWith("@/")) continue;
    const target = spec.slice(2);
    const theirLayer = layerOf(target);
    if (!ALLOWED[myLayer]) continue;

    // Rule 1 — layer direction. app -> features -> components -> lib, one way.
    if (!ALLOWED[myLayer].has(theirLayer)) {
      fail(f, "layer-direction", `${myLayer}/ must not import ${theirLayer}/ (allowed: ${[...ALLOWED[myLayer]].join(", ")})`);
    }

    if (theirLayer !== "features") continue;
    const theirFeature = target.split("/")[1];
    const subpath = target.split("/").slice(2).join("/");

    if (theirFeature === myFeature) {
      // Rule 2 — inside a feature, use relative imports.
      fail(f, "internal-absolute-import", `imports its own feature by alias ("${spec}"); use a relative path`);
      continue;
    }

    // Rule 3 — a feature is a black box: enter through features/<name>/index.ts.
    if (subpath && !STYLE.test(subpath)) {
      fail(f, "feature-barrel", `deep import "${spec}"; import from "@/features/${theirFeature}" instead`);
    }

    if (myFeature) {
      if (!edges.has(myFeature)) edges.set(myFeature, new Set());
      edges.get(myFeature).add(theirFeature);
    }
  }
}

// Rule 4 — no cycles between features.
const colour = new Map();
const trail = [];
const visit = (n) => {
  colour.set(n, "grey");
  trail.push(n);
  for (const next of edges.get(n) ?? []) {
    if (colour.get(next) === "grey") {
      const cycle = [...trail.slice(trail.indexOf(next)), next].join(" -> ");
      fail(`features/${n}`, "feature-cycle", `circular dependency: ${cycle}`);
    } else if (!colour.has(next)) visit(next);
  }
  trail.pop();
  colour.set(n, "black");
};
for (const n of edges.keys()) if (!colour.has(n)) visit(n);

// Rule 5 — components/ is grouped; nothing loose at its root.
for (const f of files) {
  if (/^components\/[^/]+$/.test(f) && !f.endsWith(".md")) {
    fail(f, "components-grouping", "put shared components in components/ui, components/layout or components/auth");
  }
}

// Rule 6 — every feature has a barrel.
for (const d of fs.readdirSync(path.join(ROOT, "features"))) {
  if (!fs.existsSync(path.join(ROOT, "features", d, "index.ts"))) {
    fail(`features/${d}`, "missing-barrel", "every feature needs an index.ts stating its public surface");
  }
}

// Rule 7 — no accidental duplicates ("admin-console 2.tsx") and no stray scratch files.
for (const f of files) {
  if (/ \d+\.(tsx?|jsx?|css)$/.test(f)) fail(f, "duplicate-file", "looks like an editor-made copy; delete it");
  if (/\.(orig|rej|bak)$/.test(f) || /\.(copy|old)\./.test(f)) fail(f, "scratch-file", "scratch file committed");
}

// Rule 8 — size ceiling, as a ratchet.
//
// 800 lines is the limit for anything new. The files below were already over
// it when the guard was written; each carries a recorded ceiling.
//
// The point is to stop these files drifting bigger while nobody is watching,
// not to block work on them. So:
//
//   - Shrink one and lower its number in the same commit.
//   - When it drops under 800, delete its line.
//   - Raising a number is allowed only for a deliberate addition, and only
//     with a note on the line saying what was added. An unexplained rise is
//     the drift this exists to catch.
//   - Never add a new file here. Split it instead.
const LIMIT = 800;
const SIZE_ALLOWANCE = new Map([
  ["app/(admin)/admin/admin-console.tsx", 1415],
  // +10: required-field markers and the error summary above the form.
  ["app/(student)/interview/practice/interview-flow.tsx", 1244],
  ["app/(student)/discover/discovery-flow.tsx", 1022],
  ["app/(student)/profile/profile-form.tsx", 909],
]);
// One generated HTML string, not hand-edited code.
const EXEMPT = new Set(["features/welcome/network-welcome-markup.ts"]);
for (const f of files) {
  if (!CODE.test(f) || EXEMPT.has(f)) continue;
  const lines = fs.readFileSync(path.join(ROOT, f), "utf8").split("\n").length;
  const ceiling = SIZE_ALLOWANCE.get(f);
  if (ceiling === undefined) {
    if (lines > LIMIT) fail(f, "file-too-large", `${lines} lines (limit ${LIMIT}); split it into a module`);
  } else if (lines > ceiling) {
    fail(f, "file-grew", `${lines} lines, above its recorded ${ceiling}; this file may only shrink`);
  } else if (lines <= LIMIT) {
    fail(f, "ratchet-stale", `${lines} lines is now under ${LIMIT} — remove it from SIZE_ALLOWANCE in this script`);
  }
}

if (!problems.length) {
  const featureCount = fs.readdirSync(path.join(ROOT, "features")).length;
  console.log(`architecture OK — ${files.length} files across ${featureCount} features, no violations`);
  process.exit(0);
}
const byRule = new Map();
for (const p of problems) {
  if (!byRule.has(p.rule)) byRule.set(p.rule, []);
  byRule.get(p.rule).push(p);
}
console.error(`\nArchitecture check failed — ${problems.length} violation(s)\n`);
for (const [rule, list] of byRule) {
  console.error(`  ${rule} (${list.length})`);
  for (const p of list) console.error(`    ${p.file}\n      ${p.detail}`);
  console.error("");
}
process.exit(1);
