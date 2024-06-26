/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "happy-dom",
    testTimeout: 50000,
    pool: "forks",
    hookTimeout: 20000,
    hideSkippedTests: true,
  },
  resolve: {
    alias: [
      { find: "@", replacement: resolve(__dirname, "src") },
      { find: "@test", replacement: resolve(__dirname, "__tests__") },
      { find: "@primodiumxyz/reactive-tables", replacement: resolve(__dirname, "dist") },
    ],
  },
  plugins: [react()],
  server: {
    open: "__tests__/devtools/mock/index.html",
  },
});
