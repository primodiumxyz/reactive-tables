import { Coord, coordEq, pixelCoordToTileCoord } from "@latticexyz/phaserx";
import { Scene } from "engine/types";
import { getBuildingAtCoord } from "src/util/tile";

import { Entity } from "@latticexyz/recs";
import { singletonEntity } from "@latticexyz/store-sync/recs";
import { components } from "src/network/components";
import { world } from "src/network/world";
import { outOfBounds } from "src/util/outOfBounds";

export const setupMouseInputs = (scene: Scene) => {
  const clickSub = scene.input.click$.subscribe(([pointer]) => {
    const selectedRock = components.ActiveRock.get()?.value;

    if (components.Account.get()?.value !== components.OwnedBy.get(selectedRock)?.value) return;

    const { x, y } = pixelCoordToTileCoord(
      { x: pointer.worldX, y: pointer.worldY },
      scene.tilemap.tileWidth,
      scene.tilemap.tileHeight
    );

    const gameCoord = { x, y: -y };

    if (!selectedRock || outOfBounds(gameCoord, selectedRock)) {
      components.SelectedBuilding.remove();
      components.SelectedTile.remove();
      components.SelectedAction.remove();
      return;
    }

    const selectedAction = components.SelectedAction.get()?.value;

    if (selectedAction !== undefined) return;

    const building = getBuildingAtCoord(gameCoord, (selectedRock as Entity) ?? singletonEntity) as Entity;

    if (!building) {
      components.SelectedBuilding.remove();
      components.SelectedTile.set(gameCoord);
    } else {
      components.SelectedBuilding.set({ value: building });
      components.SelectedTile.remove();
    }
  });

  const pointerMoveSub = scene.input.pointermove$.pipe().subscribe((event) => {
    const { x, y } = pixelCoordToTileCoord(
      { x: event.worldX, y: event.worldY },
      scene.tilemap.tileWidth,
      scene.tilemap.tileHeight
    );

    const mouseCoord = { x, y: -y } as Coord;

    //set hover tile if it is different
    const currentHoverTile = components.HoverTile.get();
    if (coordEq(currentHoverTile, mouseCoord)) return;

    const selectedRock = components.ActiveRock.get()?.value;
    if (!selectedRock || outOfBounds(mouseCoord, selectedRock)) {
      components.HoverTile.remove();
      return;
    }

    components.HoverTile.set(mouseCoord);
  });

  const rightClickSub = scene.input.rightClick$.subscribe(() => {
    components.Send.reset();
    components.Attack.reset();
  });

  world.registerDisposer(() => {
    clickSub.unsubscribe();
    pointerMoveSub.unsubscribe();
    rightClickSub.unsubscribe();
  }, "game");
};
