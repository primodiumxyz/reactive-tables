import type { Tables } from "@/tables/types";
import { render } from "@/lib/dev/render";
import type { VisualizerOptions } from "@/lib/dev/config/types";
import type { ContractTableDefs, StoreConfig } from "@/lib/definitions";

export const createDevVisualizer = async <
  config extends StoreConfig,
  extraTableDefs extends ContractTableDefs | undefined,
  otherDevTables extends Tables | undefined,
>(
  options: VisualizerOptions<config, extraTableDefs, otherDevTables>,
): Promise<() => void> => {
  if (typeof window !== "undefined") return await render(options);

  // TODO: create dev server?
  console.warn("Please start a webserver with pnpm dev:visualizer first");
  return () => {};
};
