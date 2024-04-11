import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "bin/postgres-frontend.ts",
    "bin/clean-local-docker-indexer.ts",
    "bin/local-docker-indexer.ts",
  ],
  target: "esnext",
  format: ["esm"],
  dts: false,
  sourcemap: true,
  clean: true,
  minify: true,
});
