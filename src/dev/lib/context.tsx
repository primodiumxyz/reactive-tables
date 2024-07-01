import React, { createContext, useContext, type ReactNode } from "react";

import type { Tables } from "@/tables/types";
import type { DevToolsProps } from "@/dev/lib/types";
import type { ContractTableDefs, StoreConfig } from "@/lib/definitions";

type DevToolsContextType<
  config extends StoreConfig = StoreConfig,
  extraTableDefs extends ContractTableDefs | undefined = ContractTableDefs | undefined,
  otherDevTables extends Tables | undefined = Tables | undefined,
> = DevToolsProps<config, extraTableDefs, otherDevTables>;
const DevToolsContext = createContext<DevToolsContextType | null>(null);

export const DevToolsProvider = <
  config extends StoreConfig,
  extraTableDefs extends ContractTableDefs | undefined,
  otherDevTables extends Tables | undefined,
>({
  children,
  value,
}: {
  children: ReactNode;
  value: DevToolsContextType<config, extraTableDefs, otherDevTables>;
}) => {
  const currentValue = useContext(DevToolsContext);
  if (currentValue) throw new Error("DevToolsProvider can only be used once");

  // @ts-expect-error generic types
  return <DevToolsContext.Provider value={value}>{children}</DevToolsContext.Provider>;
};

export const useDevTools = <
  config extends StoreConfig,
  extraTableDefs extends ContractTableDefs | undefined,
  otherDevTables extends Tables | undefined,
>() => {
  const value = useContext(DevToolsContext);
  if (!value) throw new Error("Must be used within a DevToolsProvider");
  return value as unknown as DevToolsProps<config, extraTableDefs, otherDevTables>;
};
