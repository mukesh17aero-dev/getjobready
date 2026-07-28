import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Architecture enforcement. These rules are the difference between "modular
// monolith" as an intention and as an invariant — without them the boundaries
// hold only until the first person in a hurry, and nothing fails.
//
// The dependency direction is one-way:
//
//     app/  ->  modules/  ->  lib/
//     components/ -> (types only)
//
// See CLAUDE.md § Modular monolith — hard rules.

const NO_APP_IMPORTS = {
  group: ["@/app/*", "@/app/**"],
  message:
    "app/ is the outermost layer. Nothing may import from it — move the shared code into a module or lib/.",
};

const NO_DEEP_MODULE_IMPORTS = {
  group: ["@/modules/*/*"],
  message:
    "Import a module through its public API only: `@/modules/<name>`. A module's internal files are private to it (use relative paths inside the module).",
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Everything outside app/ must not depend on app/.
  {
    files: ["modules/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [NO_APP_IMPORTS] }],
    },
  },

  // app/ composes modules; it may not reach into their internals.
  {
    files: ["app/**/*.{ts,tsx}", "middleware.ts"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [NO_DEEP_MODULE_IMPORTS] }],
    },
  },

  // A module may not reach into another module's internals, and may not depend
  // on app/. Inside its own folder it uses relative imports.
  {
    files: ["modules/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [NO_APP_IMPORTS, NO_DEEP_MODULE_IMPORTS] },
      ],
    },
  },

  // lib/ is the innermost layer: shared technical helpers with no domain
  // knowledge. It cannot depend on a module.
  {
    files: ["lib/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            NO_APP_IMPORTS,
            {
              group: ["@/modules/*", "@/modules/**"],
              message:
                "lib/ is shared plumbing and must not depend on a domain module — the dependency runs modules/ -> lib/, never the reverse.",
            },
          ],
        },
      ],
    },
  },

  // Components are presentational: props in, JSX out. No database access, no
  // module runtime code.
  {
    files: ["components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            NO_APP_IMPORTS,
            NO_DEEP_MODULE_IMPORTS,
            {
              group: ["@/lib/db", "@/lib/db/*"],
              message:
                "Components never query the database. Fetch in a Server Component under app/ (via a module) and pass the result down as a prop.",
            },
          ],
        },
      ],
    },
  },

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
