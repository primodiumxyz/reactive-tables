import { tileCoordToPixelCoord } from "@latticexyz/phaserx";
import { Entity, Has, defineEnterSystem, defineExitSystem, defineUpdateSystem, namespaceWorld } from "@latticexyz/recs";
import { Scene } from "engine/types";
import { components } from "src/network/components";
import { world } from "src/network/world";
import { ObjectPosition } from "../../common/object-components/common";
import { Square } from "../../common/object-components/graphics";

const objGraphicsIndex = (entity: Entity) => `${entity}_hoverTile_graphics`;

export const renderHoverTile = (scene: Scene) => {
  const { tileWidth, tileHeight } = scene.tilemap;
  const systemsWorld = namespaceWorld(world, "systems");

  const query = [Has(components.HoverTile)];

  const render = ({ entity }: { entity: Entity }) => {
    const tileCoord = components.HoverTile.get();

    if (!tileCoord) return;

    const pixelCoord = tileCoordToPixelCoord(tileCoord, tileWidth, tileHeight);

    scene.objectPool.remove(objGraphicsIndex(entity));

    const hoverRenderObject = scene.objectPool.get(objGraphicsIndex(entity), "Graphics");

    hoverRenderObject.setComponents([
      ObjectPosition({
        x: Math.floor(pixelCoord.x / tileWidth) * tileWidth,
        y: -Math.floor(pixelCoord.y / tileWidth) * tileHeight,
      }),
      Square(tileWidth, tileHeight, {
        borderThickness: 0,
        alpha: 0.2,
      }),
    ]);
  };

  defineEnterSystem(systemsWorld, query, (update) => {
    render(update);
  });

  defineUpdateSystem(systemsWorld, query, render);

  defineExitSystem(systemsWorld, query, (update) => {
    scene.objectPool.remove(objGraphicsIndex(update.entity));
  });
};
