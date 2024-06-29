import React, { createContext, useContext, type ReactNode } from "react";

import type { Tables } from "@/tables/types";
import type { VisualizerOptions } from "@/dev/lib/types";
import type { ContractTableDefs, StoreConfig } from "@/lib/definitions";

/* -------------------------------------------------------------------------- */
/*                                 VISUALIZER                                 */
/* -------------------------------------------------------------------------- */

type VisualizerContextType<
  config extends StoreConfig = StoreConfig,
  extraTableDefs extends ContractTableDefs | undefined = ContractTableDefs | undefined,
  otherDevTables extends Tables | undefined = Tables | undefined,
> = VisualizerOptions<config, extraTableDefs, otherDevTables>;
const VisualizerContext = createContext<VisualizerContextType | null>(null);

export const VisualizerProvider = <
  config extends StoreConfig,
  extraTableDefs extends ContractTableDefs | undefined,
  otherDevTables extends Tables | undefined,
>({
  children,
  value,
}: {
  children: ReactNode;
  value: VisualizerContextType<config, extraTableDefs, otherDevTables>;
}) => {
  const currentValue = useContext(VisualizerContext);
  if (currentValue) throw new Error("VisualizerProvider can only be used once");

  // @ts-expect-error generic types
  return <VisualizerContext.Provider value={value}>{children}</VisualizerContext.Provider>;
};

export const useVisualizer = <
  config extends StoreConfig,
  extraTableDefs extends ContractTableDefs | undefined,
  otherDevTables extends Tables | undefined,
>() => {
  const value = useContext(VisualizerContext);
  if (!value) throw new Error("Must be used within a VisualizerProvider");
  return value as unknown as VisualizerOptions<config, extraTableDefs, otherDevTables>;
};
