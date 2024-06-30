import type { Tables } from "@/tables/types";
import { mount } from "@/dev/mount";
import type { VisualizerOptions } from "@/dev/lib/types";
import type { ContractTableDefs, StoreConfig } from "@/lib/definitions";

export const createDevVisualizer = async <
  config extends StoreConfig,
  extraTableDefs extends ContractTableDefs | undefined,
  otherDevTables extends Tables | undefined,
>(
  options: VisualizerOptions<config, extraTableDefs, otherDevTables>,
): Promise<() => void> => {
  if (typeof window !== "undefined") {
    // @ts-expect-error union type too complex to represent
    const unmount = await mount(options);
    options.world.registerDisposer(unmount);
  }

  // TODO: create dev server?
  console.warn("Please start a webserver with pnpm dev:visualizer first");
  return () => {};
};
