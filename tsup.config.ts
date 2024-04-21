import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/store/internal/index.ts", "src/store/queries/index.ts"],
  outDir: "dist",
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: true,
  tsconfig: "./tsconfig.json",
});
