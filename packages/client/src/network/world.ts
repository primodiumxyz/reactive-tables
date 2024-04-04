import { createWorld } from "@latticexyz/recs";
import { singletonEntity } from "@latticexyz/store-sync/recs";

// The world contains references to all entities, all components and disposers.
export const world = createWorld();
export const singletonIndex = world.registerEntity({ id: singletonEntity });
