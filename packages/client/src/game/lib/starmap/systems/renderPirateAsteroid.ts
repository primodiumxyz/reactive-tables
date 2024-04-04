import { Assets, DepthLayers, SpriteKeys } from "@game/constants";
import { Entity, Has, defineSystem, namespaceWorld } from "@latticexyz/recs";
import { singletonEntity } from "@latticexyz/store-sync/recs";
import { Coord } from "@latticexyz/utils";
import { Scene } from "engine/types";
import { toast } from "react-toastify";
import { throttleTime } from "rxjs";
import { components } from "src/network/components";
import { world } from "src/network/world";
import { getRandomRange } from "src/util/common";
import { PIRATE_KEY } from "src/util/constants";
import { decodeEntity, hashKeyEntity } from "src/util/encode";
import { getCanAttack, getCanSend } from "src/util/unit";
import {
  ObjectPosition,
  OnClickUp,
  OnComponentSystem,
  OnHover,
  OnOnce,
  OnRxjsSystem,
  SetValue,
  Tween,
} from "../../common/object-components/common";
import { Outline, Texture } from "../../common/object-components/sprite";
import { ObjectText } from "../../common/object-components/text";
import { tileCoordToPixelCoord } from "@latticexyz/phaserx";

export const renderPirateAsteroid = (scene: Scene) => {
  const { tileWidth, tileHeight } = scene.tilemap;
  const systemsWorld = namespaceWorld(world, "systems");

  const render = (entity: Entity, coord: Coord) => {
    scene.objectPool.removeGroup("asteroid_" + entity);

    const ownedBy = components.OwnedBy.get(entity, {
      value: singletonEntity,
    }).value;

    const playerEntity = components.Account.get()?.value;
    if (!playerEntity || hashKeyEntity(PIRATE_KEY, playerEntity) !== ownedBy) return;

    const asteroidObjectGroup = scene.objectPool.getGroup("asteroid_" + entity);

    const spriteScale = 0.7;
    const pixelCoord = tileCoordToPixelCoord(coord, tileWidth, tileHeight);
    const sharedComponents = [
      ObjectPosition({
        x: pixelCoord.x,
        y: -pixelCoord.y,
      }),
      SetValue({
        originX: 0.5,
        originY: 0.5,
        scale: spriteScale,
      }),
      Tween(scene, {
        scale: { from: spriteScale - getRandomRange(0, 0.05), to: spriteScale + getRandomRange(0, 0.05) },
        ease: "Sine.easeInOut",
        hold: getRandomRange(0, 1000),
        duration: 5000, // Duration of one wobble
        yoyo: true, // Go back to original scale
        repeat: -1, // Repeat indefinitely
      }),
      Tween(scene, {
        x: { from: pixelCoord.x - getRandomRange(0, 5), to: pixelCoord.x + getRandomRange(0, 5) },
        ease: "Sine.easeInOut",
        hold: getRandomRange(0, 1000),
        duration: 5000, // Duration of one wobble
        yoyo: true, // Go back to original scale
        repeat: -1, // Repeat indefinitely
      }),
      Tween(scene, {
        y: { from: -pixelCoord.y - getRandomRange(0, 5), to: -pixelCoord.y + getRandomRange(0, 5) },
        ease: "Sine.easeInOut",
        hold: getRandomRange(0, 1000),
        duration: 5000, // Duration of one wobble
        yoyo: true, // Go back to original scale
        repeat: -1, // Repeat indefinitely
      }),
    ];

    const rotationTween = Tween(scene, {
      rotation: { from: -getRandomRange(0, Math.PI / 8), to: getRandomRange(0, Math.PI / 8) },
      // ease: "Sine.easeInOut",
      hold: getRandomRange(0, 10000),
      duration: 5 * 1000, // Duration of one wobble
      yoyo: true, // Go back to original scale
      repeat: -1, // Repeat indefinitely
    });

    const asteroidBody = asteroidObjectGroup.add("Sprite");
    asteroidBody.setComponents([
      ...sharedComponents,
      rotationTween,
      Texture(Assets.SpriteAtlas, SpriteKeys.PirateAsteroid1),

      SetValue({
        depth: DepthLayers.Rock,
      }),
    ]);

    const outlineSprite =
      SpriteKeys[`Asteroid${ownedBy === playerEntity ? "Player" : "Enemy"}` as keyof typeof SpriteKeys];

    const asteroidOutline = asteroidObjectGroup.add("Sprite");

    asteroidOutline.setComponents([
      ...sharedComponents,
      rotationTween,
      OnComponentSystem(components.SelectedRock, () => {
        if (components.SelectedRock.get()?.value === entity) {
          if (asteroidOutline.hasComponent(Outline().id)) return;
          asteroidOutline.setComponent(Outline({ thickness: 1.5, color: 0xffa500 }));
          return;
        }

        if (asteroidOutline.hasComponent(Outline().id)) {
          asteroidOutline.removeComponent(Outline().id);
        }
      }),
      OnClickUp(scene, () => {
        console.log("clicked on", entity);
        const attackOrigin = components.Attack.get()?.originFleet;
        const sendOrigin = components.Send.get()?.originFleet;
        if (attackOrigin) {
          if (getCanAttack(attackOrigin, entity)) components.Attack.setDestination(entity);
          else toast.error("Cannot attack this asteroid.");
        } else if (sendOrigin) {
          if (getCanSend(sendOrigin, entity)) components.Send.setDestination(entity);
          else toast.error("Cannot send to this asteroid.");
        } else {
          components.SelectedRock.set({ value: entity });
        }
      }),
      OnHover(
        () => components.HoverEntity.set({ value: entity }),
        () => components.HoverEntity.remove()
      ),
      Texture(Assets.SpriteAtlas, outlineSprite),
      SetValue({
        depth: DepthLayers.Rock + 1,
      }),
    ]);

    const asteroidLabel = asteroidObjectGroup.add("BitmapText");

    asteroidLabel.setComponents([
      ...sharedComponents,
      SetValue({
        originX: 0.5,
        originY: -3,
        depth: DepthLayers.Marker,
      }),
      ObjectText("PIRATE", {
        id: "addressLabel",
        color: 0xffa500,
        fontSize: Math.max(8, Math.min(24, 16 / scene.camera.phaserCamera.zoom)),
      }),
      OnOnce((gameObject) => {
        gameObject.setFontSize(Math.max(8, Math.min(24, 16 / scene.camera.phaserCamera.zoom)));
      }),
      OnComponentSystem(components.DefeatedPirate, (gameObject, { entity }) => {
        const { pirate } = decodeEntity(components.DefeatedPirate.metadata.keySchema, entity);
        if (pirate !== entity) return;
        asteroidLabel.setComponent(
          ObjectText("DEFEATED PIRATE", {
            id: "addressLabel",
            color: 0xff0000,
            fontSize: Math.max(8, Math.min(24, 16 / scene.camera.phaserCamera.zoom)),
          })
        );
        asteroidBody.setComponent(SetValue({ alpha: 0.5 }));
      }),
      OnRxjsSystem(
        // @ts-ignore
        scene.camera.zoom$.pipe(throttleTime(10)),
        (gameObject, zoom) => {
          const mapOpen = components.MapOpen.get()?.value ?? false;

          if (!mapOpen) return;

          const size = Math.max(8, Math.min(24, 16 / zoom));

          gameObject.setFontSize(size);
        }
      ),
    ]);
  };

  const query = [
    Has(components.Asteroid),
    Has(components.Position),
    Has(components.PirateAsteroid),
    Has(components.OwnedBy),
  ];

  defineSystem(systemsWorld, query, ({ entity, value }) => {
    if (!value[0]) return;
    const coord = components.Position.get(entity);
    if (!coord) return;
    const defeated = components.PirateAsteroid.get(entity)?.isDefeated ?? false;
    if (defeated) {
      const key = "asteroid_" + entity;
      if (scene.objectPool.getGroup(key)) scene.objectPool.removeGroup("asteroid_" + entity);
      return;
    }

    render(entity, coord);
  });
};
