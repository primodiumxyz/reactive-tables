import { createServer, type ViteDevServer } from "vite";
import { resolve } from "path";

import type { Tables } from "@/tables/types";
import { mount } from "@/dev/mount";
import type { DevToolsProps } from "@/dev/lib/types";
import type { ContractTableDefs, StoreConfig } from "@/lib/definitions";

let server: ViteDevServer | null = null;

export const createDevTools = async <
  config extends StoreConfig,
  extraTableDefs extends ContractTableDefs | undefined,
  otherDevTables extends Tables | undefined,
>(
  options: DevToolsProps<config, extraTableDefs, otherDevTables>,
): Promise<() => void> => {
  // Browser
  if (typeof window !== "undefined") {
    // @ts-expect-error union type too complex to represent
    const unmount = await mount(options);
    options.world.registerDisposer(unmount);
    return unmount;
  }

  // Node
  if (server) {
    console.warn("Dev visualizer server is already running");
    return () => {};
  }

  console.log("A");
  try {
    console.log("AA");
    // server = await createServer({
    //   root: resolve(__dirname, "src/dev/"),
    //   configFile: resolve(__dirname, "../../vite.config.ts"),
    //   server: {
    //     // open: false,
    //     open: resolve(__dirname, "src/dev/vite/index.html"),
    //   },
    // });
    server = await Promise.race([
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000)), // 10 seconds timeout
      createServer({
        root: resolve(__dirname, "src/dev"),
        configFile: resolve(__dirname, "../../vite.config.ts"),
        server: { open: false },
      }),
    ]);

    console.log("B");
    await server.listen();
    console.log("C");

    const visualizerURL = `http://localhost:${server.config.server.port}/index.html`;
    console.log(`Visualizer running at ${visualizerURL}`);
    // Open the visualizer in the default browser
    const open = (await import("open")).default;
    console.log("D");
    await open(visualizerURL);
    console.log("E");

    return () => {
      if (server) {
        server.close();
        server = null;
      }
    };
  } catch (err) {
    console.error("Failed to start visualizer server", err);
    return () => {};
  }
};
