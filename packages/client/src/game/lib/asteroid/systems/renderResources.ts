import { ResourceToTilesetKey, Tilesets } from "@game/constants";
import { defineComponentSystem, namespaceWorld } from "@latticexyz/recs";
import { decodeEntity } from "@latticexyz/store-sync/recs";
import { Scene } from "engine/types";
import { components } from "src/network/components";
import { world } from "src/network/world";
import { outOfMaxBounds } from "src/util/outOfBounds";

export function renderResources(scene: Scene) {
  const systemsWorld = namespaceWorld(world, "systems");
  const dims = components.P_Asteroid.get();
  if (!dims) return;

  const map = scene.phaserScene.add.tilemap(
    undefined,
    scene.tilemap.tileWidth,
    scene.tilemap.tileHeight,
    dims.xBounds,
    dims.yBounds
  );

  defineComponentSystem(systemsWorld, components.ActiveRock, ({ value: [newVal] }) => {
    const activeRock = newVal?.value;
    const asteroidData = components.Asteroid.get(activeRock);

    if (!asteroidData || !activeRock) return;
    map.removeAllLayers();

    const tileset = map.addTilesetImage(Tilesets.Resource);
    if (!tileset) return;

    map?.createBlankLayer(Tilesets.Resource, tileset, 0, -dims.yBounds * scene.tilemap.tileHeight);

    const tiles = components.P_Terrain.getAll();

    tiles.forEach((tile) => {
      const tileId = components.P_Terrain.get(tile)?.value;

      if (!tileId) return;

      const { mapId, x, y } = decodeEntity(components.P_Terrain.metadata.keySchema, tile);

      if (mapId !== asteroidData.mapId) return;

      if (!outOfMaxBounds({ x, y }, activeRock)) map?.putTileAt(ResourceToTilesetKey[tileId], x, dims.yBounds - y);
    });
  });
}
