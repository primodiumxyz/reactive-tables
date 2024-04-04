import { tileCoordToPixelCoord } from "@latticexyz/phaserx";
import {
  Entity,
  Has,
  HasValue,
  defineComponentSystem,
  defineEnterSystem,
  defineExitSystem,
  defineUpdateSystem,
  namespaceWorld,
  runQuery,
} from "@latticexyz/recs";
import { Coord } from "@latticexyz/utils";

import { Scene } from "engine/types";
import { world } from "src/network/world";
import { safeIndex } from "src/util/array";

import {
  Assets,
  AudioKeys,
  DepthLayers,
  EntityIDtoAnimationKey,
  EntityToResourceSpriteKey,
  EntityToUnitSpriteKey,
  EntitytoBuildingSpriteKey,
  SpriteKeys,
} from "@game/constants";
import { createAudioApi } from "src/game/api/audio";
import { createFxApi } from "src/game/api/fx";
import { components } from "src/network/components";
import { getBuildingDimensions, getBuildingTopLeft } from "src/util/building";
import { getRandomRange } from "src/util/common";
import { Action, EntityType, ResourceEntityLookup, ResourceStorages, SPEED_SCALE } from "src/util/constants";
import {
  ObjectPosition,
  OnComponentSystem,
  OnHover,
  OnUpdateSystem,
  SetValue,
} from "../../common/object-components/common";
import { Animation, Outline, Texture } from "../../common/object-components/sprite";
import { Hex } from "viem";
import { formatResourceCount } from "src/util/number";
import { EResource } from "contracts/config/enums";
import { getFullResourceCount } from "src/util/resource";
import { hashEntities } from "src/util/encode";

const MAX_SIZE = 2 ** 15 - 1;
export const renderBuilding = (scene: Scene) => {
  const { tileHeight, tileWidth } = scene.tilemap;
  const systemsWorld = namespaceWorld(world, "systems");
  const spectateWorld = namespaceWorld(world, "game_spectate");
  const audio = createAudioApi(scene);
  const fx = createFxApi(scene);
  const worldSpeed = components.P_GameConfig.get()?.worldSpeed ?? SPEED_SCALE;

  defineComponentSystem(systemsWorld, components.ActiveRock, ({ value }) => {
    if (!value[0] || value[0]?.value === value[1]?.value) return;

    const activeRock = value[0]?.value as Entity;

    world.dispose("game_spectate");

    const positionQuery = [
      HasValue(components.Position, {
        parent: value[0]?.value,
      }),
      Has(components.BuildingType),
      Has(components.IsActive),
      Has(components.Level),
    ];

    const oldPositionQuery = [
      HasValue(components.Position, {
        parent: value[1]?.value,
      }),
      Has(components.BuildingType),
      Has(components.IsActive),
      Has(components.Level),
    ];

    for (const entity of runQuery(oldPositionQuery)) {
      const renderId = `${entity}_entitySprite`;
      scene.objectPool.removeGroup(renderId);
    }

    const render = ({ entity }: { entity: Entity }) => {
      const renderId = `${entity}_entitySprite`;

      const buildingType = components.BuildingType.get(entity)?.value as Entity | undefined;

      if (!buildingType) return;

      //remove droid base if mainbase exists
      if (buildingType === EntityType.MainBase) {
        const droidBaseEntity = hashEntities(activeRock, EntityType.DroidBase);
        components.Position.remove(droidBaseEntity);
        components.BuildingType.remove(droidBaseEntity);
        components.Level.remove(droidBaseEntity);
        components.IsActive.remove(droidBaseEntity);
        components.OwnedBy.remove(droidBaseEntity);
      }

      const origin = components.Position.get(entity);
      if (!origin) return;
      const tilePosition = getBuildingTopLeft(origin, buildingType);

      // don't render beyond coord map limitation
      if (Math.abs(tilePosition.x) > MAX_SIZE || Math.abs(tilePosition.y) > MAX_SIZE) return;

      const pixelCoord = tileCoordToPixelCoord(tilePosition as Coord, tileWidth, tileHeight);

      scene.objectPool.removeGroup(renderId);
      const buildingRenderGroup = scene.objectPool.getGroup(renderId);

      const buildingSprite = buildingRenderGroup.add("Sprite");
      const buildingSpriteOutline = buildingRenderGroup.add("Sprite");

      const buildingDimensions = getBuildingDimensions(buildingType);
      const assetPair = getAssetKeyPair(entity, buildingType);

      const active = components.IsActive.get(entity)?.value;
      const sharedComponents = [
        ObjectPosition({
          x: pixelCoord.x,
          y: -pixelCoord.y + buildingDimensions.height * tileHeight,
        }),
        SetValue({
          originY: 1,
        }),

        OnUpdateSystem([...positionQuery, Has(components.Level)], () => {
          const isActive = components.IsActive.get(entity)?.value;
          const updatedAssetPair = getAssetKeyPair(entity, buildingType);
          buildingSprite.setComponents([
            Texture(Assets.SpriteAtlas, updatedAssetPair.sprite),
            updatedAssetPair.animation ? Animation(updatedAssetPair.animation, !isActive) : undefined,
            SetValue({ tint: isActive ? 0xffffff : 0x777777 }),
          ]);
        }),
        SetValue({ tint: active ? 0xffffff : 0x777777 }),
        assetPair.animation ? Animation(assetPair.animation, !active) : undefined,
        OnComponentSystem(components.IsActive, (_, { entity: _entity }) => {
          if (entity !== _entity) return;
          const updatedAssetPair = getAssetKeyPair(entity, buildingType);
          const isActive = components.IsActive.get(entity)?.value;
          if (!isActive) {
            buildingSprite.setComponents([
              SetValue({ tint: 0x777777 }),
              updatedAssetPair.animation ? Animation(updatedAssetPair.animation, true) : undefined,
            ]);
          } else {
            buildingSprite.setComponents([
              SetValue({ tint: 0xffffff }),
              updatedAssetPair.animation ? Animation(updatedAssetPair.animation) : undefined,
            ]);
          }
        }),
        Texture(Assets.SpriteAtlas, assetPair.sprite),
      ];

      buildingSprite.setComponents([
        SetValue({
          depth: DepthLayers.Building - tilePosition.y + buildingDimensions.height,
        }),
        OnHover(
          () => {
            if (components.SelectedAction.get()?.value !== Action.PlaceBuilding)
              components.HoverEntity.set({ value: entity });
          },
          () => {
            components.HoverEntity.remove();
          },
          true
        ),
        OnComponentSystem(components.Time, (_, { value }) => {
          const hoverEntity = components.HoverEntity.get()?.value;
          const selectedBuilding = components.SelectedBuilding.get()?.value;
          const selectedBuildingType = components.BuildingType.get(entity)?.value;

          if (selectedBuildingType === EntityType.MainBase) return;

          if (hoverEntity !== entity && selectedBuilding !== entity) return;

          const frequency = 1n;
          if ((value[0]?.value ?? 0n) % frequency !== 0n) return;

          if (components.BuildRock.get()?.value !== activeRock || !components.IsActive.get(entity)?.value) return;

          const textCoord = {
            x: tilePosition.x + buildingDimensions.width / 2,
            y: tilePosition.y,
          };

          const producedResource = components.P_Production.getWithKeys({
            level: components.Level.get(entity)?.value ?? 1n,
            prototype: buildingType as Hex,
          });

          producedResource?.resources.forEach((resource, i) => {
            const resourceEntity = ResourceEntityLookup[resource as EResource];
            const amount = producedResource.amounts[i];

            if (!ResourceStorages.has(resourceEntity)) return;

            const { production, resourceStorage, resourceCount } = getFullResourceCount(resourceEntity, activeRock);

            const productionScaled = (amount * worldSpeed) / SPEED_SCALE;
            let text = "";
            let color = 0xffffff;
            if (resourceCount >= resourceStorage) {
              text = "full";
              color = 0x00ffff;
            } else if (production <= 0) return;
            else {
              text = formatResourceCount(resourceEntity, productionScaled * frequency, {
                short: true,
                fractionDigits: 2,
              });
            }

            fx.emitFloatingText(text, textCoord, {
              icon: EntityToResourceSpriteKey[resourceEntity],
              color,
            });
          });

          const consumedResource = components.P_RequiredDependency.getWithKeys({
            level: components.Level.get(entity)?.value ?? 1n,
            prototype: buildingType as Hex,
          });

          if (!consumedResource) return;

          //render consumed resources
          const consumedResourceEntity = ResourceEntityLookup[consumedResource.resource as EResource];
          const consumedResourceAmount = consumedResource.amount;

          const { resourceCount, production: consumption } = getFullResourceCount(consumedResourceEntity, activeRock);

          if (Math.abs(Number(consumption)) > resourceCount) {
            fx.emitFloatingText("empty", textCoord, {
              icon: EntityToResourceSpriteKey[consumedResourceEntity],
              color: 0xff6e63,
              delay: 500,
            });

            return;
          }

          const consumptionScaled = (consumedResourceAmount * worldSpeed) / SPEED_SCALE;

          const text = formatResourceCount(consumedResourceEntity, consumptionScaled * frequency, {
            short: true,
            fractionDigits: 2,
          });

          fx.emitFloatingText(text, textCoord, {
            icon: EntityToResourceSpriteKey[consumedResourceEntity],
            color: 0xff6e63,
            delay: 500,
          });
        }),
        OnComponentSystem(components.TrainingQueue, (_, { entity: trainingBuildingEntity, value }) => {
          if (entity !== trainingBuildingEntity || !value[0]) return;

          const queue = value[0];

          if (queue.units.length === 0 || queue.timeRemaining[0] !== 1n) return;

          //its the last tick for the queue, so show floating text of unit produced
          const unit = queue.units[0];
          const textCoord = {
            x: tilePosition.x + buildingDimensions.width / 2 - 0.5,
            y: tilePosition.y + buildingDimensions.height / 2,
          };

          fx.emitFloatingText("+", textCoord, {
            icon: EntityToUnitSpriteKey[unit],
            color: 0x00ffff,
            delay: 1000,
            prefixText: true,
          });
        }),
        ...sharedComponents,
      ]);

      buildingSpriteOutline.setComponents([
        SetValue({ depth: DepthLayers.Building, alpha: 0 }),
        OnComponentSystem(components.SelectedBuilding, (gameObject) => {
          if (buildingSpriteOutline.hasComponent("select_outline")) {
            if (components.SelectedBuilding.get()?.value === entity) return;
            buildingSpriteOutline.removeComponent("select_outline");
            gameObject.setAlpha(0);
          }

          if (components.SelectedBuilding.get()?.value === entity) {
            gameObject.clearFX();
            buildingSpriteOutline.setComponent(Outline({ id: "select_outline", knockout: true, color: 0x00ffff }));
            gameObject.setAlpha(1);
            audio.play(AudioKeys.Confirm, "ui", {
              volume: 0.5,
              detune: getRandomRange(-10, 10),
            });
            return;
          }
        }),
        OnComponentSystem(components.HoverEntity, (gameObject) => {
          if (
            buildingSpriteOutline.hasComponent("hover_outline") &&
            components.SelectedBuilding.get()?.value !== entity
          ) {
            if (components.HoverEntity.get()?.value === entity) return;
            buildingSpriteOutline.removeComponent("hover_outline");
            gameObject.setAlpha(0);
          }

          if (components.HoverEntity.get()?.value === entity && components.SelectedBuilding.get()?.value !== entity) {
            buildingSpriteOutline.setComponent(Outline({ id: "hover_outline", knockout: true, color: 0x808080 }));
            gameObject.setAlpha(1);
            return;
          }
        }),
        ...sharedComponents,
      ]);
    };

    const throwDust = ({ entity }: { entity: Entity }) => {
      const buildingType = components.BuildingType.get(entity)?.value as Entity | undefined;

      if (!buildingType) return;

      const origin = components.Position.get(entity);
      if (!origin) return;
      const tilePosition = getBuildingTopLeft(origin, buildingType);

      // don't render beyond coord map limitation
      if (Math.abs(tilePosition.x) > MAX_SIZE || Math.abs(tilePosition.y) > MAX_SIZE) return;

      const pixelCoord = tileCoordToPixelCoord(tilePosition as Coord, tileWidth, tileHeight);

      const buildingDimensions = getBuildingDimensions(buildingType);

      //throw up dust on build
      flare(
        scene,
        {
          x: pixelCoord.x + (tileWidth * buildingDimensions.width) / 2,
          y: -pixelCoord.y + (tileHeight * buildingDimensions.height) / 2,
        },
        buildingDimensions.width
      );
    };

    defineEnterSystem(spectateWorld, positionQuery, render);
    //dust particle animation on new building
    defineEnterSystem(spectateWorld, positionQuery, throwDust);

    defineUpdateSystem(spectateWorld, positionQuery, (update) => {
      render(update);
      throwDust(update);
    });

    defineExitSystem(spectateWorld, positionQuery, ({ entity }) => {
      const renderId = `${entity}_entitySprite`;

      scene.objectPool.removeGroup(renderId);
    });
  });
};

function getAssetKeyPair(entityId: Entity, buildingType: Entity) {
  const sprites = EntitytoBuildingSpriteKey[buildingType];
  const animations = EntityIDtoAnimationKey[buildingType];

  const level = components.Level.get(entityId)?.value ? parseInt(components.Level.get(entityId)!.value.toString()) : 1;

  const spriteKey = sprites ? safeIndex(level - 1, sprites) : SpriteKeys.IronMine1;

  const animationKey = animations ? safeIndex(level - 1, animations) : undefined;

  return {
    sprite: spriteKey,
    animation: animationKey,
  };
}

//temporary dust particle animation to test
const flare = (scene: Scene, coord: Coord, size = 1) => {
  scene.phaserScene.add
    .particles(coord.x, coord.y, "flare", {
      speed: 100,
      lifespan: 300 * size,
      quantity: 10,
      scale: { start: 0.3, end: 0 },
      tintFill: true,
      // emitting: true,
      color: [0x828282, 0xbfbfbf, 0xe8e8e8],
      // emitZone: { type: 'edge', source: , quantity: 42 },
      duration: 100,
    })
    .start();
};
