import { defineComponentSystem, namespaceWorld } from "@latticexyz/recs";
import { DoubleCounter } from "../components/clientComponents";
import { SetupResult } from "../types";
import { world } from "../world";

export const setupDoubleCounter = ({ components }: SetupResult) => {
  const { Counter } = components;
  const systemWorld = namespaceWorld(world, "systems");

  defineComponentSystem(systemWorld, Counter, (update) => {
    const value = update?.value[0]?.value ?? 0;
    DoubleCounter.set({ value: BigInt(value) * BigInt(2) });
  });
};
