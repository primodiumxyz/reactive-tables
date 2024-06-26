import React, { createContext, useContext, type ReactNode } from "react";

import type { VisualizerOptions } from "@/lib/dev/config/types";

const VisualizerContext = createContext<VisualizerOptions | null>(null);

export const VisualizerProvider = ({ children, value }: { children: ReactNode; value: VisualizerOptions }) => {
  const currentValue = useContext(VisualizerContext);
  if (currentValue) throw new Error("VisualizerProvider can only be used once");

  return <VisualizerContext.Provider value={value}>{children}</VisualizerContext.Provider>;
};

export const useVisualizer = () => {
  const value = useContext(VisualizerContext);
  if (!value) throw new Error("Must be used within a VisualizerProvider");
  return value;
};
