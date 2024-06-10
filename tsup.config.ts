import { defineConfig } from "tsup";

export default defineConfig({
  entity: {
    index: "src/index.ts",
    utils: "src/utils.ts",
  },
  outDir: "dist",
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: true,
  tsconfig: "./tsconfig.json",
});
