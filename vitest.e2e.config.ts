import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/e2e/**/*.e2e.spec.ts"],
    testTimeout: 30_000,
    hookTimeout: 15_000,
    // PTY-based tests have inherent timing sensitivity with Ink's rendering.
    // Retry once to handle transient render boundary detection issues.
    retry: 2,
  },
});
