import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
    env: {
      CRON_SECRET: "test-cron-secret-at-least-16-chars",
    },
  },
});
