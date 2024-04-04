import { components } from "src/network/components";
import { Scene } from "engine/types";
import { Entity, defineComponentSystem, namespaceWorld } from "@latticexyz/recs";
import { world } from "src/network/world";
import { getAsteroidBounds, getAsteroidMaxBounds } from "src/util/outOfBounds";
import { Tilesets } from "@game/constants";
import { Coord } from "@latticexyz/utils";

export const renderBounds = (scene: Scene) => {
  const systemsWorld = namespaceWorld(world, "systems");
  const { tileWidth, tileHeight } = scene.tilemap;

  const dims = components.P_Asteroid.get();
  if (!dims) return;

  const map = scene.phaserScene.add.tilemap(
    undefined,
    scene.tilemap.tileWidth,
    scene.tilemap.tileHeight,
    dims.xBounds,
    dims.yBounds
  );

  //handle tilesets
  const outerBorderTileset = map.addTilesetImage(Tilesets.BoundsOuterBorder, undefined, tileWidth, tileHeight, 1, 2);
  const innerBorderTileset = map.addTilesetImage(Tilesets.BoundsInnerBorder, undefined, tileWidth, tileHeight, 1, 2);
  const nonBuildableTileset = map.addTilesetImage(Tilesets.BoundsNonBuildable, undefined, tileWidth, tileHeight, 1, 2);

  const drawBounds = (activeRock: Entity) => {
    map.removeAllLayers();
    scene.objectPool.removeGroup("bounds");
    const maxBounds = getAsteroidMaxBounds(activeRock);
    const currentBounds = getAsteroidBounds(activeRock);

    if (!activeRock) return;

    if (!outerBorderTileset || !nonBuildableTileset || !innerBorderTileset) return;

    function getRelativeCoord(coord: Coord) {
      return {
        x: coord.x - maxBounds.minX,
        y: coord.y - maxBounds.minY,
      };
    }

    const maxBoundsStart = getRelativeCoord({ x: maxBounds.minX, y: maxBounds.minY });
    const maxBoundsEnd = getRelativeCoord({ x: maxBounds.maxX, y: maxBounds.maxY });
    const currentBoundsStart = getRelativeCoord({ x: currentBounds.minX, y: currentBounds.minY });
    const currentBoundsEnd = getRelativeCoord({ x: currentBounds.maxX, y: currentBounds.maxY });
    const layerX = maxBounds.minX * scene.tilemap.tileWidth;
    const layerY = (-maxBounds.maxY + 1) * scene.tilemap.tileHeight;
    const width = maxBoundsEnd.x - maxBoundsStart.x;
    const height = maxBoundsEnd.y - maxBoundsStart.y;

    //handle layers
    const outerBordersLayer = map?.createBlankLayer("borders", outerBorderTileset, layerX, layerY, width, height);
    const innerBorderLayer = map?.createBlankLayer("innerBorders", innerBorderTileset, layerX, layerY, width, height);
    const nonBuildableLayer = map?.createBlankLayer("nonBuildable", nonBuildableTileset, layerX, layerY, width, height);
    outerBordersLayer?.setDepth(10);
    if (!outerBordersLayer || !nonBuildableLayer || !innerBorderLayer) return;

    for (let x = maxBoundsStart.x; x < maxBoundsEnd.x; x++) {
      for (let y = maxBoundsStart.x; y < maxBoundsEnd.y; y++) {
        //outer border
        if (x === maxBoundsStart.x || x === maxBoundsEnd.x - 1 || y === maxBoundsStart.y || y === maxBoundsEnd.y - 1) {
          let tileId = 9;

          switch (true) {
            //top left corner
            case x === maxBoundsStart.y && y === 0:
              tileId = 1;
              break;
            //top right corner
            case x === maxBoundsEnd.x - 1 && y === maxBoundsStart.y:
              tileId = 3;
              break;
            //bottom left corner
            case x === maxBoundsStart.x && y === maxBoundsEnd.y - 1:
              tileId = 6;
              break;
            //bottom right corner
            case x === maxBoundsEnd.x - 1 && y === maxBoundsEnd.y - 1:
              tileId = 8;
              break;
            // top tile
            case y === maxBoundsStart.y:
              tileId = 2;
              break;
            case x === maxBoundsStart.x:
              tileId = 4;
              break;
            case x === maxBoundsEnd.x - 1:
              tileId = 5;
              break;
            case y === maxBoundsEnd.y - 1:
              tileId = 7;
              break;
          }

          outerBordersLayer.putTileAt(tileId, x, y);
        }

        // //dont render non buildable tiles inside the current bounds
        if (
          x >= currentBoundsStart.x - 1 &&
          x <= currentBoundsEnd.x &&
          y >= currentBoundsStart.y - 1 &&
          y <= currentBoundsEnd.y
        ) {
          switch (true) {
            case x === currentBoundsStart.x - 1 && y === currentBoundsStart.y - 1:
              innerBorderLayer.putTileAt(0, x, y);
              break;
            case x === currentBoundsEnd.x && y === currentBoundsStart.y - 1:
              innerBorderLayer.putTileAt(0, x, y);
              break;
            case x === currentBoundsStart.x - 1 && y === currentBoundsEnd.y:
              innerBorderLayer.putTileAt(0, x, y);
              break;
            case x === currentBoundsEnd.x && y === currentBoundsEnd.y:
              innerBorderLayer.putTileAt(0, x, y);
              break;
            case x === currentBoundsStart.x - 1:
              innerBorderLayer.putTileAt(1, x, y);
              break;
            case x === currentBoundsEnd.x:
              innerBorderLayer.putTileAt(2, x, y);
              break;
            case y === currentBoundsStart.y - 1:
              innerBorderLayer.putTileAt(3, x, y);
              break;
            case y === currentBoundsEnd.y:
              innerBorderLayer.putTileAt(4, x, y);
              break;

            default:
              continue;
          }
        }

        //normal tiles
        nonBuildableLayer.putTileAt(2, x, y);
      }
    }

    nonBuildableLayer.setAlpha(0.8);

    const glowEffect = outerBordersLayer.postFX.addGlow(0x008b8b, 4, 0, false, 0.05, 30);

    scene.phaserScene.tweens.add({
      targets: nonBuildableLayer,
      alpha: { from: 0.8, to: 0.5 },
      duration: 3000,
      ease: Phaser.Math.Easing.Sine.InOut,
      yoyo: true,
      repeat: -1,
    });

    scene.phaserScene.tweens.add({
      targets: glowEffect,
      outerStrength: 0.5,
      duration: 3000,
      ease: Phaser.Math.Easing.Sine.InOut,
      yoyo: true,
      repeat: -1,
    });

    nonBuildableLayer.postFX.addVignette(0.5, 0.5, 3, 1);

    //TODO: map decorations
    // const object = scene.phaserScene.add
    //   .sprite(maxBounds.minX * tileWidth, (maxBounds.maxY - 1.5) * -tileHeight, Assets.SpriteAtlas, SpriteKeys.Warning)
    //   .setScale(1.5)
    //   .setAlpha(1);

    // scene.phaserScene.tweens.add({
    //   targets: object,
    //   x: { from: (maxBounds.minX - 3) * tileWidth, to: (maxBounds.maxX + 3) * tileHeight },
    //   duration: 10000,
    //   ease: (v: number) => Phaser.Math.Easing.Stepped(v, 60),
    //   repeat: -1,
    // });

    // object.setMask(new Phaser.Display.Masks.BitmapMask(scene.phaserScene, nonBuildableLayer));

    //drones
    // scene.phaserScene.add
    //   .sprite(
    //     (maxBounds.minX - 0.1) * tileWidth,
    //     (maxBounds.maxY - 0.8) * -tileHeight,
    //     Assets.SpriteAtlas,
    //     SpriteKeys.Alloy
    //   )
    //   .play(AnimationKeys.Drone)
    //   .setDepth(DepthLayers.Building);

    // scene.phaserScene.add
    //   .sprite(
    //     (maxBounds.minX - 0.2) * tileWidth,
    //     (maxBounds.minY - 1.4) * -tileHeight,
    //     Assets.SpriteAtlas,
    //     SpriteKeys.Drone
    //   )
    //   .play(AnimationKeys.Drone)
    //   .setScale(2, -2)
    //   .setDepth(DepthLayers.Building);

    // scene.phaserScene.add
    //   .sprite(
    //     (maxBounds.maxX + 0.1) * tileWidth,
    //     (maxBounds.maxY - 0.8) * -tileHeight,
    //     Assets.SpriteAtlas,
    //     SpriteKeys.Drone
    //   )
    //   .play(AnimationKeys.Drone)
    //   .setScale(-1, 1)
    //   .setDepth(DepthLayers.Building);

    // scene.phaserScene.add
    //   .sprite(
    //     (maxBounds.maxX + 0.1) * tileWidth,
    //     (maxBounds.minY - 1.2) * -tileHeight,
    //     Assets.SpriteAtlas,
    //     SpriteKeys.Drone
    //   )
    //   .play(AnimationKeys.Drone)
    //   .setScale(-1, -1)
    //   .setDepth(DepthLayers.Building);

    // bordersLayer.renderDebug(scene.phaserScene.add.graphics().setAlpha(0.5));
  };

  defineComponentSystem(systemsWorld, components.ActiveRock, ({ value }) => {
    const activeRock = value[0]?.value as Entity;
    drawBounds(activeRock);
    defineComponentSystem(
      systemsWorld,
      components.Level,
      ({ entity }) => {
        if (value[0] && value[0].value !== entity) return;

        drawBounds(activeRock);
      },
      { runOnInit: false }
    );
  });

  systemsWorld.registerDisposer(() => map.destroy());
};
