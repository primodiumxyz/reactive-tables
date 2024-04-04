import { DepthLayers } from "@game/constants";
import { tileCoordToPixelCoord } from "@latticexyz/phaserx";
import { Entity, defineComponentSystem, namespaceWorld } from "@latticexyz/recs";
import { Scene } from "engine/types";
import { createCameraApi } from "src/game/api/camera";
import { starmapSceneConfig } from "src/game/config/starmapScene";
import { components } from "src/network/components";
import { attack as callAttack } from "src/network/setup/contractCalls/attack";
import { MUD } from "src/network/types";
import { world } from "src/network/world";
import { getFleetTilePosition } from "src/util/unit";
import { ObjectPosition, OnRxjsSystem } from "../../common/object-components/common";
import { Line } from "../../common/object-components/graphics";

export const renderAttackLine = (scene: Scene, mud: MUD) => {
  const systemsWorld = namespaceWorld(world, "systems");
  const { tileWidth, tileHeight } = scene.tilemap;
  const id = "attackLine";
  const { pan, zoomTo } = createCameraApi(scene);

  function panToDestination(entity: Entity) {
    const fleetDestinationEntity = components.FleetMovement.get(entity)?.destination as Entity;
    if (!fleetDestinationEntity) return;
    const fleetDestinationPosition = components.Position.get(fleetDestinationEntity);
    if (!fleetDestinationPosition) return;
    pan(fleetDestinationPosition);
  }

  async function render(originEntity: Entity) {
    scene.objectPool.removeGroup(id);
    const isFleet = components.IsFleet.get(originEntity)?.value;
    const origin = isFleet ? getFleetTilePosition(scene, originEntity) : components.Position.get(originEntity);
    if (!origin) return;

    const zoomTime = 500;
    zoomTo(starmapSceneConfig.camera.maxZoom, zoomTime);
    panToDestination(originEntity);
    await new Promise((resolve) => setTimeout(resolve, zoomTime));

    const attackLine = scene.objectPool.getGroup(id);
    const trajectory = attackLine.add("Graphics", `${originEntity}-attackLine`, true);
    const originPixelCoord = tileCoordToPixelCoord({ x: origin.x, y: -origin.y }, tileWidth, tileHeight);
    const x = scene.input.phaserInput.activePointer.worldX;
    const y = scene.input.phaserInput.activePointer.worldY;

    trajectory.setComponents([
      ObjectPosition(originPixelCoord, DepthLayers.Marker),
      Line(
        { x, y },
        {
          id: `attackLine-line`,
          thickness: Math.min(10, 3 / scene.camera.phaserCamera.zoom),
          alpha: 0.25,
          color: 0xff0000,
        }
      ),

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-expect-error
      OnRxjsSystem(scene.camera.zoom$, async (_, zoom) => {
        trajectory.removeComponent(`attackLine-line`);
        const x = scene.input.phaserInput.activePointer.worldX;
        const y = scene.input.phaserInput.activePointer.worldY;
        trajectory.setComponent(
          Line(
            { x, y },
            {
              id: `attackLine-line`,
              thickness: Math.min(10, 3 / zoom),
              alpha: 0.25,
              color: 0xff0000,
            }
          )
        );
      }),

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-expect-error
      OnRxjsSystem(scene.input.pointermove$, (_, { worldX, worldY }) => {
        trajectory.removeComponent(`moveLine-line`);
        const x = worldX;
        const y = worldY;

        trajectory.setComponent(
          Line(
            { x, y },
            {
              id: `attackLine-line`,
              thickness: Math.min(10, 3 / scene.camera.phaserCamera.zoom),
              alpha: 0.25,
              color: 0xff0000,
            }
          )
        );
      }),
    ]);
  }

  defineComponentSystem(systemsWorld, components.Attack, async ({ value }) => {
    // const mapOpen = components.MapOpen.get()?.value;
    const attack = value[0];
    if (!attack || !attack.originFleet) {
      if (value[1]?.originFleet) zoomTo(1);
      scene.objectPool.removeGroup(id);
      return;
    }
    if (attack.destination) {
      scene.objectPool.removeGroup(id);
      components.Attack.reset();
      components.SelectedFleet.clear();
      components.SelectedRock.clear();
      await callAttack(mud, attack.originFleet, attack.destination);
      return;
    }

    render(attack.originFleet);
  });
};
