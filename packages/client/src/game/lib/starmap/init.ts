// STAR MAP ENTRY POINT
import { starmapSceneConfig } from "../../config/starmapScene";

import { Game } from "engine/types";
import { components } from "src/network/components";
import { world } from "src/network/world";
import { setupKeybinds } from "../asteroid/setup/setupKeybinds";
import { setupBasicCameraMovement } from "../common/setup/setupBasicCameraMovement";
import { createAudioApi } from "src/game/api/audio";

export const initStarmapScene = async (game: Game) => {
  const scene = await game.sceneManager.addScene(starmapSceneConfig, false);
  const audio = createAudioApi(scene);
  audio.initializeAudioVolume();

  setupBasicCameraMovement(scene, {
    translateKeybind: false,
  });
  setupKeybinds(scene);

  const clickSub = scene.input.click$.subscribe(([pointer, objects]) => {
    //if we have more than one object, we want to emit the pointerdown and pointerup events on all of them except the first one
    if (objects.length > 1) {
      objects.slice(1).forEach((obj) => {
        obj.emit("pointerdown", pointer);
        obj.emit("pointerup", pointer);
      });
      return;
    }

    if (objects.length !== 0) return;
    components.SelectedRock.remove();
    components.SelectedFleet.remove();
    components.Send.reset();
    components.Attack.reset();
  });

  world.registerDisposer(() => {
    clickSub.unsubscribe();
    game.dispose();
  }, "game");
};
