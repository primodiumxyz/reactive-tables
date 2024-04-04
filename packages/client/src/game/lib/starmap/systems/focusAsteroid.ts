import { Entity, Has, defineEnterSystem, defineUpdateSystem, namespaceWorld } from "@latticexyz/recs";
import { Scene } from "engine/types";

import { world } from "src/network/world";

import { createCameraApi } from "src/game/api/camera";
import { components } from "src/network/components";

export const focusAsteroid = (scene: Scene) => {
  const { pan } = createCameraApi(scene);
  const gameWorld = namespaceWorld(world, "game");

  const query = [Has(components.Home)];

  const handleMove = async () => {
    const playerEntity = components.Account.get()?.value;
    const activeAsteroid = components.Home.get(playerEntity)?.value as Entity;

    if (!activeAsteroid) return;

    const coord = components.Position.get(activeAsteroid);
    if (!coord) return;

    pan(coord, 0);
  };

  defineEnterSystem(gameWorld, query, handleMove);

  defineUpdateSystem(gameWorld, query, handleMove);
};
