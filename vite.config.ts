import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  test: {
    environment: "happy-dom",
    testTimeout: 50000,
    pool: "forks",
    hookTimeout: 20000,
  },
});
