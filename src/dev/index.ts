import type { Tables } from "@/tables/types";
import type { DevToolsProps } from "@/dev/lib/types";
import type { ContractTableDefs, StoreConfig } from "@/lib/definitions";

export const createDevTools = async <
  config extends StoreConfig,
  extraTableDefs extends ContractTableDefs | undefined,
  otherDevTables extends Tables | undefined,
>(
  options: DevToolsProps<config, extraTableDefs, otherDevTables>,
): Promise<() => void> => {
  if (typeof window !== "undefined") {
    const { mount } = await import("@/dev/mount");
    return await mount(options);
  }

  throw new Error("Dev tools can only be mounted in the browser");
};
