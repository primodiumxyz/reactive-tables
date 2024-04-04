import { defineComponentSystem, namespaceWorld } from "@latticexyz/recs";
import { Scene } from "engine/types";

import { createCameraApi } from "src/game/api/camera";
import { components } from "src/network/components";
import { world } from "src/network/world";
import { EntityType } from "src/util/constants";

export const focusMainbase = (scene: Scene) => {
  const { pan } = createCameraApi(scene);
  const systemsWorld = namespaceWorld(world, "systems");

  const handleMove = () => {
    const mainBaseCoord = components.Position.get(EntityType.MainBase) ?? { x: 0, y: 0 };

    pan(mainBaseCoord, 0);
  };

  defineComponentSystem(systemsWorld, components.ActiveRock, handleMove);
};
