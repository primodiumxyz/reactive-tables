import { coordEq, pixelCoordToTileCoord, tileCoordToPixelCoord } from "@latticexyz/phaserx";
import { Coord } from "@latticexyz/utils";
import { Scene } from "engine/types";

// const anchorMap =
export const createCameraApi = (targetScene: Scene) => {
  function pan(coord: Coord, duration = 1000, ease = "Power2") {
    const { phaserScene, camera, tilemap } = targetScene;

    const pixelCoord = tileCoordToPixelCoord(coord, tilemap.tileWidth, tilemap.tileHeight);

    const scroll = camera.phaserCamera.getScroll(pixelCoord.x, -pixelCoord.y);

    //we want new tween to be active for responsive behavior. New tween are created if on new end coord.
    if (phaserScene.tweens.getTweensOf(camera.phaserCamera).length) {
      const currentTween = phaserScene.tweens.getTweensOf(camera.phaserCamera)[0];

      const endCoord = {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        x: currentTween.data[0]?.end ?? 0,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-expect-error
        y: currentTween.data[1]?.end ?? 0,
      };

      if (coordEq(endCoord, scroll)) return;

      phaserScene.tweens.killTweensOf(camera.phaserCamera);
    }

    phaserScene?.tweens.add({
      targets: camera.phaserCamera,
      scrollX: scroll.x,
      scrollY: scroll.y,
      duration,
      ease,
      onUpdate: () => {
        updateWorldView();
      },
    });
  }

  function zoomTo(zoom: number, duration = 1000, ease = "Power2") {
    const { camera } = targetScene;

    camera.phaserCamera.zoomTo(zoom, duration, ease, false, () => {
      targetScene.input.phaserInput.activePointer.updateWorldPoint(camera.phaserCamera);
      updateWorldView();
    });
  }

  function getPosition() {
    const { camera, tilemap } = targetScene;

    const coord = camera?.phaserCamera.worldView;
    if (!coord) throw new Error("Camera not found.");

    const tileCoord = pixelCoordToTileCoord(coord, tilemap.tileWidth, tilemap.tileHeight);

    return {
      x: tileCoord.x,
      y: -tileCoord.y,
    };
  }

  function updateWorldView() {
    const { camera } = targetScene;

    requestAnimationFrame(() => {
      camera.zoom$.next(camera.phaserCamera.zoom);
      camera.worldView$.next(camera.phaserCamera.worldView);
    });
  }

  function screenCoordToWorldCoord(screenCoord: Coord) {
    const { camera } = targetScene;

    const pixelCoord = camera.phaserCamera.getWorldPoint(screenCoord.x, screenCoord.y);

    return pixelCoord;
  }

  function worldCoordToScreenCoord(worldCoord: Coord) {
    const { camera } = targetScene;

    //convert canvas screen coord to phaser screen coord
    // Convert world coord to phaser screen coord
    const screenCoordX = (worldCoord.x - camera.phaserCamera.worldView.x) * camera.phaserCamera.zoom;
    const screenCoordY = (worldCoord.y - camera.phaserCamera.worldView.y) * camera.phaserCamera.zoom;

    return { x: screenCoordX, y: screenCoordY };
  }

  const shake = () => {
    const { camera } = targetScene;

    if (!targetScene.phaserScene.scene.isActive()) return;

    camera.phaserCamera.shake(300, 0.01 / camera.phaserCamera.zoom);
  };

  function createDOMContainer(id: string, coord: Coord, raw = false) {
    const {
      tilemap: { tileHeight, tileWidth },
    } = targetScene;
    const pixelCoord = raw ? coord : tileCoordToPixelCoord(coord, tileWidth, tileHeight);
    pixelCoord.y = raw ? pixelCoord.y : -pixelCoord.y;

    const div = document.createElement("div");
    div.id = id;

    const obj = targetScene.phaserScene.add.dom(pixelCoord.x, pixelCoord.y, div);

    targetScene.phaserScene.data.set(id, { obj, container: div });

    return { obj, container: div };
  }

  return {
    pan,
    zoomTo,
    getPosition,
    screenCoordToWorldCoord,
    worldCoordToScreenCoord,
    updateWorldView,
    shake,
    createDOMContainer,
    ...targetScene.camera,
  };
};
