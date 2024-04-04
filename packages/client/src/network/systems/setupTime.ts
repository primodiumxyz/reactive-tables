import { defineRxSystem, namespaceWorld } from "@latticexyz/recs";
import { components } from "../components";
import { SetupResult } from "../types";
import { world } from "../world";

export function setupTime({
  network: {
    clock: { time$ },
  },
}: SetupResult) {
  const systemWorld = namespaceWorld(world, "systems");
  defineRxSystem(systemWorld, time$, (time) => {
    components.Time.set({ value: BigInt(time) });
  });
}
