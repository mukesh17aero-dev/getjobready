// Removes file-sync conflict copies ("routes.d 2.ts") from the build cache.
//
// Something in this working copy — iCloud Drive or Finder — periodically
// duplicates generated files inside .next/. Those copies match the generated
// types glob in tsconfig.json and fail the typecheck with duplicate-identifier
// errors that have nothing to do with the code. TypeScript's `exclude` globs
// do not support character classes, so they cannot be filtered out there.
//
// The real fix is to keep the repository outside a syncing folder. Until then
// this runs before typecheck and build so the gate reflects the code.

import { readdir, rm } from "node:fs/promises";
import path from "node:path";

const CONFLICT = /\s\d+\.(?:tsx?|mjs|js|json)$/;

async function sweep(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return 0; // no .next yet, nothing to clean
  }
  let removed = 0;
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) removed += await sweep(full);
    else if (CONFLICT.test(entry.name)) {
      await rm(full, { force: true });
      removed += 1;
    }
  }
  return removed;
}

const removed = await sweep(path.join(process.cwd(), ".next"));
if (removed > 0) console.log(`cleaned ${removed} sync conflict file(s) from .next`);
