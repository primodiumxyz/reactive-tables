import { render } from "@/lib/dev/render";
import type { VisualizerOptions } from "@/lib/dev/config/types";
import type { Tables } from "@/tables/types";

export const createDevVisualizer = async <tables extends Tables>(
  options: VisualizerOptions<tables>,
): Promise<() => void> => {
  if (typeof window !== "undefined") return await render(options);

  // TODO: create dev server?
  console.warn("Please start a webserver with pnpm dev:visualizer first");
  return () => {};
};
