import { DepthLayers } from "@game/constants";
import { tileCoordToPixelCoord } from "@latticexyz/phaserx";
import { Entity, defineComponentSystem, namespaceWorld } from "@latticexyz/recs";
import { Scene } from "engine/types";
import { toast } from "react-toastify";
import { createCameraApi } from "src/game/api/camera";
import { starmapSceneConfig } from "src/game/config/starmapScene";
import { components } from "src/network/components";
import { sendFleetPosition } from "src/network/setup/contractCalls/fleetMove";
import { MUD } from "src/network/types";
import { world } from "src/network/world";
import { getFleetTilePosition } from "src/util/unit";
import { ObjectPosition, OnRxjsSystem } from "../../common/object-components/common";
import { Line } from "../../common/object-components/graphics";

export const renderMoveLine = (scene: Scene, mud: MUD) => {
  const systemsWorld = namespaceWorld(world, "systems");
  const id = "moveLine";
  const { zoomTo } = createCameraApi(scene);
  const { tileWidth, tileHeight } = scene.tilemap;

  function render(originEntity: Entity) {
    scene.objectPool.removeGroup(id);
    const isFleet = components.IsFleet.get(originEntity)?.value;
    const origin = isFleet ? getFleetTilePosition(scene, originEntity) : components.Position.get(originEntity);
    if (!origin) return;
    const originPixelCoord = tileCoordToPixelCoord({ x: origin.x, y: -origin.y }, tileWidth, tileHeight);
    zoomTo(starmapSceneConfig.camera.minZoom, 500);
    const moveLine = scene.objectPool.getGroup(id);
    const trajectory = moveLine.add("Graphics", `${originEntity}-moveline`, true);
    const x = scene.input.phaserInput.activePointer.worldX;
    const y = scene.input.phaserInput.activePointer.worldY;

    trajectory.setComponents([
      ObjectPosition(originPixelCoord, DepthLayers.Marker),
      Line(
        { x, y },
        {
          id: `moveLine-line`,
          thickness: Math.min(10, 3 / scene.camera.phaserCamera.zoom),
          alpha: 0.25,
          color: 0xffffff,
        }
      ),

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-expect-error
      OnRxjsSystem(scene.camera.zoom$, async (_, zoom) => {
        trajectory.removeComponent(`moveLine-line`);
        const x = scene.input.phaserInput.activePointer.worldX;
        const y = scene.input.phaserInput.activePointer.worldY;
        trajectory.setComponent(
          Line(
            { x, y },
            {
              id: `moveLine-line`,
              thickness: Math.min(10, 3 / zoom),
              alpha: 0.25,
              color: 0xffffff,
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
              id: `moveLine-line`,
              thickness: Math.min(10, 3 / scene.camera.phaserCamera.zoom),
              alpha: 0.25,
              color: 0xffffff,
            }
          )
        );
      }),
    ]);
  }

  defineComponentSystem(systemsWorld, components.Send, async ({ value }) => {
    // const mapOpen = components.MapOpen.get()?.value;
    const send = value[0];
    if (!send || !send.originFleet) {
      scene.objectPool.removeGroup(id);
      if (value[1]?.originFleet) zoomTo(1);

      return;
    }
    if (send.destination) {
      scene.objectPool.removeGroup(id);
      components.Send.reset();
      components.SelectedFleet.clear();
      components.SelectedRock.clear();
      const destinationPosition = components.Position.get(send.destination);
      if (!destinationPosition) return toast.error("Invalid destination");
      await sendFleetPosition(mud, send.originFleet, destinationPosition);
      return;
    }

    render(send.originFleet);
  });
};
