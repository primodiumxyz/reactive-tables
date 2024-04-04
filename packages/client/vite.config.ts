import { sentryVitePlugin } from "@sentry/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { comlink } from "vite-plugin-comlink";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    react(),
    comlink(),
    tsconfigPaths(),
    sentryVitePlugin({
      org: "primodium",
      project: "primodium",
    }),
  ],
  server: {
    port: 3000,
    fs: {
      strict: false,
    },
  },
  worker: {
    plugins: [comlink()],
  },
  build: {
    rollupOptions: {
      external: [/^contracts:.*/],
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          mud: [
            "@latticexyz/common",
            "@latticexyz/protocol-parser",
            "@latticexyz/dev-tools",
            "@latticexyz/react",
            "@latticexyz/recs",
            "@latticexyz/schema-type",
            "@latticexyz/store",
            "@latticexyz/store-sync",
            "@latticexyz/utils",
            "@latticexyz/world",
          ],
        },
      },
    },
    target: "ES2022",
  },

  optimizeDeps: {
    esbuildOptions: {
      supported: {
        bigint: true,
      },
    },

    include: [
      "proxy-deep",
      "bn.js",
      "js-sha3",
      "hash.js",
      "bech32",
      "long",
      "protobufjs/minimal",
      "debug",
      "is-observable",
      "nice-grpc-web",
      "@improbable-eng/grpc-web",
    ],
  },
  envPrefix: "PRI_",
  envDir: "../../",
});
