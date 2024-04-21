import { defineConfig } from "vitest/config";
// lib
import tsconfigPaths from "vite-tsconfig-paths";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "tinybase-state-manager",
      fileName: (format) => `tinybaseStateManager.${format}.js`,
    },
    rollupOptions: {
      input: {
        index: "src/index.ts",
        "store/internal": "src/store/internal/index.ts",
        "store/queries": "src/store/queries/index.ts",
      },
      external: /^react/,
      output: {
        globals: {
          react: "React",
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "happy-dom",
    testTimeout: 50000,
    pool: "forks",
    hookTimeout: 20000,
  },
});
