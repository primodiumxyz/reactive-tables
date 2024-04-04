import { Gesture } from "@use-gesture/vanilla";
import { BehaviorSubject, share, Subject } from "rxjs";
import { tileCoordToPixelCoord } from "@latticexyz/phaserx";
import { Coord, GestureState, ObjectPool } from "@latticexyz/phaserx/src/types";
import { CameraConfig } from "../../types";

export function createCamera(phaserCamera: Phaser.Cameras.Scene2D.Camera, options: CameraConfig) {
  // Stop default gesture events to not collide with use-gesture
  // https://github.com/pmndrs/use-gesture/blob/404e2b2ac145a45aff179c1faf5097b97414731c/documentation/pages/docs/gestures.mdx#about-the-pinch-gesture
  document.addEventListener("gesturestart", (e) => e.preventDefault());
  document.addEventListener("gesturechange", (e) => e.preventDefault());

  const worldView$ = new BehaviorSubject<Phaser.Cameras.Scene2D.Camera["worldView"]>(phaserCamera.worldView).pipe(
    share()
  ) as BehaviorSubject<Phaser.Cameras.Scene2D.Camera["worldView"]>;
  const zoom$ = new BehaviorSubject<number>(phaserCamera.zoom).pipe(share()) as BehaviorSubject<number>;
  const pinchStream$ = new Subject<GestureState<"onPinch">>();

  const gesture = new Gesture(
    phaserCamera.scene.game.canvas,
    {
      onPinch: (state) => pinchStream$.next(state),
    },
    {}
  );

  const onResize = () => {
    requestAnimationFrame(() => worldView$.next(phaserCamera.worldView));
  };
  phaserCamera.scene.scale.addListener("resize", onResize);

  function setZoom(zoom: number) {
    const { minZoom, maxZoom } = options;
    const _zoom = Phaser.Math.Clamp(zoom, minZoom, maxZoom);
    phaserCamera.setZoom(_zoom);
    zoom$.next(_zoom);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-expect-error
    phaserCamera.preRender();
    requestAnimationFrame(() => {
      worldView$.next(phaserCamera.worldView);
    });
  }

  function ignore(objectPool: ObjectPool, ignore: boolean) {
    objectPool.ignoreCamera(phaserCamera.id, ignore);
  }

  function centerOnCoord(tileCoord: Coord, tileWidth: number, tileHeight: number) {
    const pixelCoord = tileCoordToPixelCoord(tileCoord, tileWidth, tileHeight);
    centerOn(pixelCoord.x, pixelCoord.y);
  }

  function centerOn(x: number, y: number) {
    phaserCamera.centerOn(x, y);
    requestAnimationFrame(() => worldView$.next(phaserCamera.worldView));
  }

  function setScroll(x: number, y: number) {
    phaserCamera.setScroll(x, y);
    requestAnimationFrame(() => worldView$.next(phaserCamera.worldView));
  }

  return {
    phaserCamera,
    worldView$,
    zoom$,
    ignore,
    dispose: () => {
      pinchStream$.unsubscribe();
      zoom$.unsubscribe();
      gesture.destroy();
      phaserCamera.scene.scale.removeListener("resize", onResize);
    },
    centerOnCoord,
    centerOn,
    setScroll,
    setZoom,
  };
}
