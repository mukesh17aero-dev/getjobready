// Removes file-sync conflict copies ("admin-console 2.tsx", "routes.d 2.ts").
//
// This working copy lives under ~/Documents, which iCloud Drive syncs. When a
// file is rewritten quickly, iCloud sometimes keeps the old contents beside it
// with a " 2" suffix. Two things then go wrong:
//
//   - copies inside .next/ match the generated-types glob in tsconfig.json and
//     fail the typecheck with duplicate-identifier errors about code nobody
//     wrote;
//   - copies inside the source tree are stale forks of real files. They get
//     linted, they get committed by accident, and they are indistinguishable
//     from a deliberate file when read months later.
//
// The real fix is to keep the repository outside a syncing folder. Until then
// this runs before typecheck and build so the gate reflects the code.
//
// A source copy is only removed when the original it shadows still exists, so
// a file deliberately named "plan 2.ts" is never touched.

import { readdir, rm, access } from "node:fs/promises";
import path from "node:path";

const CONFLICT = /^(.*) \d+(\.(?:tsx?|mjs|cjs|js|json|css))$/;
const SKIP = new Set(["node_modules", ".git", ".vercel", "certificates"]);

async function sweep(dir, requireOriginal) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const removed = [];
  for (const entry of entries) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removed.push(...(await sweep(full, requireOriginal)));
      continue;
    }
    const match = CONFLICT.exec(entry.name);
    if (!match) continue;
    if (requireOriginal) {
      const original = path.join(dir, match[1] + match[2]);
      try {
        await access(original);
      } catch {
        continue; // nothing it could be a copy of; leave it alone
      }
    }
    await rm(full, { force: true });
    removed.push(path.relative(process.cwd(), full));
  }
  return removed;
}

const root = process.cwd();
const generated = await sweep(path.join(root, ".next"), false);
const source = (
  await Promise.all(
    ["app", "components", "features", "lib", "tests", "scripts"].map((dir) =>
      sweep(path.join(root, dir), true),
    ),
  )
).flat();

if (generated.length) console.log(`cleaned ${generated.length} sync conflict file(s) from .next`);
for (const file of source) console.log(`cleaned sync conflict copy: ${file}`);
