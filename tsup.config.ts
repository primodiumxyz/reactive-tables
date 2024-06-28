import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    utils: "src/utils.ts",
    dev: "src/dev.ts",
  },
  external: ["react", "react-dom"],
  outDir: "dist",
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: true,
  tsconfig: "./tsconfig.prod.json",
});
