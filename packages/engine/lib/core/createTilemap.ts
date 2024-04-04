import type Phaser from "phaser";
import { TilemapConfig } from "../../types";

export const createTilemap = (
  scene: Phaser.Scene,
  tileWidth: number,
  tileHeight: number,
  defaultKey?: string,
  config?: TilemapConfig
) => {
  const renderTilemap = (key: string) => {
    currentMap?.destroy();
    const mapData = scene.cache.tilemap.get(key).data as Phaser.Tilemaps.MapData;

    const map = scene.add.tilemap(key);

    const tilesets = mapData.tilesets.map((tileset) =>
      map.addTilesetImage(tileset.name, tileset.name)
    ) as Phaser.Tilemaps.Tileset[];

    (mapData.layers as Phaser.Tilemaps.LayerData[]).forEach((layer) => {
      const _layer = map.createLayer(layer.name, tilesets, -19 * tileWidth, -50 * tileWidth);

      const depth = config?.[key]?.[layer.name]?.depth;
      if (depth && _layer) {
        _layer.setDepth(depth);
      }
    });

    currentMap = map;
    return map;
  };

  let currentMap: Phaser.Tilemaps.Tilemap | null = defaultKey ? renderTilemap(defaultKey) : null;

  const dispose = () => {
    // currentMap?.removeAllLayers();
    currentMap?.destroy();
  };

  const getMap = () => currentMap;

  return { render: renderTilemap, getMap, tileHeight, tileWidth, dispose };
};
