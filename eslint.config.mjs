import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Layer enforcement for a frontend-only repo. Business logic lives in the
// backend repository (ascend-backend); here the only boundary is:
//
//     app/  ->  lib/        components/ -> (types only)
//
// See CLAUDE.md § Layer rules.

const NO_APP_IMPORTS = {
  group: ["@/app/*", "@/app/**"],
  message:
    "app/ is the outermost layer. Nothing may import from it — move the shared code into components/ or lib/.",
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Everything outside app/ must not depend on app/.
  {
    files: ["lib/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [NO_APP_IMPORTS] }],
    },
  },

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Claude Code skill folders: tooling scripts, not app code.
    ".claude/**",
  ]),
]);

export default eslintConfig;
