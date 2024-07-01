import type { Tables } from "@/tables/types";
import { mount } from "@/dev/mount";
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore inconsistent too complex union type error
    const unmount = await mount(options);
    options.world.registerDisposer(unmount);
    return unmount;
  }

  throw new Error("Dev tools can only be mounted in the browser");
};
