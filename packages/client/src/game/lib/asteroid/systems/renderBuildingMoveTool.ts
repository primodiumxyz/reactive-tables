import { Assets, DepthLayers, EntityIDtoAnimationKey, EntitytoBuildingSpriteKey, SpriteKeys } from "@game/constants";
import { tileCoordToPixelCoord } from "@latticexyz/phaserx";
import {
  ComponentUpdate,
  Entity,
  Has,
  HasValue,
  defineEnterSystem,
  defineExitSystem,
  defineUpdateSystem,
  namespaceWorld,
} from "@latticexyz/recs";
import { singletonEntity } from "@latticexyz/store-sync/recs";
import { Scene } from "engine/types";
import { toast } from "react-toastify";
import { components } from "src/network/components";
import { moveBuilding } from "src/network/setup/contractCalls/moveBuilding";
import { MUD } from "src/network/types";
import { world } from "src/network/world";
import { getBuildingDimensions, getBuildingOrigin, validateBuildingPlacement } from "src/util/building";
import { Action } from "src/util/constants";
import { ObjectPosition, OnClick, SetValue } from "../../common/object-components/common";
import { Animation, Outline, Texture } from "../../common/object-components/sprite";

export const renderBuildingMoveTool = (scene: Scene, mud: MUD) => {
  const { tileWidth, tileHeight } = scene.tilemap;
  const systemsWorld = namespaceWorld(world, "systems");
  const objIndexSuffix = "_buildingMove";

  const render = (update: ComponentUpdate) => {
    const objIndex = update.entity + objIndexSuffix;
    const selectedBuilding = components.SelectedBuilding.get()?.value;
    if (!selectedBuilding) return;
    const buildingPrototype = components.BuildingType.get(selectedBuilding)?.value as Entity | undefined;

    const tileCoord = components.HoverTile.get();

    if (!tileCoord || !buildingPrototype) return;

    const pixelCoord = tileCoordToPixelCoord(tileCoord, tileWidth, tileHeight);

    scene.objectPool.remove(objIndex);

    const buildingTool = scene.objectPool.get(objIndex, "Sprite");

    const sprite = EntitytoBuildingSpriteKey[buildingPrototype][0];
    const animation = EntityIDtoAnimationKey[buildingPrototype]
      ? EntityIDtoAnimationKey[buildingPrototype][0]
      : undefined;

    const buildingDimensions = getBuildingDimensions(buildingPrototype);

    const selectedRock = components.ActiveRock.get()?.value as Entity;
    const validPlacement = validateBuildingPlacement(
      tileCoord,
      buildingPrototype,
      selectedRock ?? singletonEntity,
      selectedBuilding
    );

    buildingTool.setComponents([
      ObjectPosition(
        {
          x: pixelCoord.x,
          y: -pixelCoord.y + buildingDimensions.height * tileHeight,
        },
        !validPlacement ? DepthLayers.Building : DepthLayers.Building - tileCoord.y + buildingDimensions.height
      ),
      SetValue({
        alpha: 0.9,
        originY: 1,
        tint: 0xffffff,
      }),
      Texture(Assets.SpriteAtlas, sprite ?? SpriteKeys.IronMine1),
      animation ? Animation(animation) : undefined,
      Outline({
        thickness: 3,
        color: validPlacement ? undefined : 0xff0000,
      }),
      OnClick(
        scene,
        (_, pointer) => {
          //remove tooltip on right click
          if (pointer?.rightButtonDown()) {
            components.SelectedAction.remove();
            return;
          }

          if (!validPlacement) {
            toast.error("Cannot place building here");
            scene.camera.phaserCamera.shake(200, 0.001);
            return;
          }

          const buildingOrigin = getBuildingOrigin(tileCoord, buildingPrototype);
          if (!buildingOrigin) return;

          moveBuilding(mud, selectedBuilding, buildingOrigin);
          components.SelectedAction.remove();
        },
        true
      ),
    ]);
  };

  const query = [
    Has(components.HoverTile),
    HasValue(components.SelectedAction, {
      value: Action.MoveBuilding,
    }),
  ];

  defineEnterSystem(systemsWorld, query, render);
  defineUpdateSystem(systemsWorld, query, render);

  defineExitSystem(systemsWorld, query, (update) => {
    const objIndex = update.entity + objIndexSuffix;

    scene.objectPool.remove(objIndex);
  });
};
