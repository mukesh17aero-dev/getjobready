import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  // next/font cannot run outside Next's compiler; tests get a stand-in.
  resolve: { alias: { "next/font/google": new URL("./tests/stubs/next-font-google.ts", import.meta.url).pathname } },
  test: {
    environment: "node",
  },
});
