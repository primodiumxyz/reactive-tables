import { render } from "@/lib/dev/render";
import type { VisualizerOptions } from "@/lib/dev/config/types";

export const openVisualizer = async (options: VisualizerOptions): Promise<() => void> => {
  if (typeof window !== "undefined") return render(options);

  // TODO: create dev server?
  console.warn("Please start a webserver with pnpm dev:visualizer first");
  return () => {};
};
