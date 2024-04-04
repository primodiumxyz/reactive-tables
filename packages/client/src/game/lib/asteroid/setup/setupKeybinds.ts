import { KeybindActions } from "@game/constants";
import { Entity } from "@latticexyz/recs";
import { Scene } from "engine/types";
import { createCameraApi } from "src/game/api/camera";
import { createInputApi } from "src/game/api/input";
import { components } from "src/network/components";
import { world } from "src/network/world";

export const setupKeybinds = (scene: Scene) => {
  const { pan } = createCameraApi(scene);
  const { addListener } = createInputApi(scene);

  const mainbaseKeybind = addListener(KeybindActions.Base, () => {
    //TODO - fix converting to entity
    const selectedRockEntity = components.SelectedRock.get()?.value;
    if (!selectedRockEntity) return;
    const mainBase = components.Home.get(selectedRockEntity) as Entity | undefined;

    if (!mainBase) return;

    const mainBaseCoord = components.Position.get(mainBase);
    if (mainBaseCoord) pan(mainBaseCoord);
  });

  const escapeKeybind = addListener(KeybindActions.Esc, () => {
    // todo: dont run this if a modal is open
    if (components.SelectedBuilding.get()) {
      components.SelectedBuilding.remove();
      components.SelectedAction.remove();
    }

    if (components.Send.get() || components.Attack.get()) {
      components.Send.reset();
      components.Attack.reset();
    } else if (components.SelectedFleet.get()) components.SelectedFleet.remove();

    if (components.SelectedRock.get()) components.SelectedRock.remove();
  });

  world.registerDisposer(() => {
    mainbaseKeybind.dispose();
    escapeKeybind.dispose();
  }, "game");
};
