// ASTEROID MAP ENTRY POINT
import { Game } from "engine/types";
import { createAudioApi } from "src/game/api/audio";
import { world } from "src/network/world";
import { asteroidSceneConfig } from "../../config/asteroidScene";
import { setupBasicCameraMovement } from "../common/setup/setupBasicCameraMovement";
import { setupKeybinds } from "./setup/setupKeybinds";
import { setupMouseInputs } from "./setup/setupMouseInputs";

export const initAsteroidScene = async (game: Game) => {
  const scene = await game.sceneManager.addScene(asteroidSceneConfig, true);
  const audio = createAudioApi(scene);
  audio.initializeAudioVolume();

  scene.camera.phaserCamera.fadeIn(1000);

  setupMouseInputs(scene);
  setupBasicCameraMovement(scene);
  setupKeybinds(scene);

  world.registerDisposer(() => {
    game.dispose();
  }, "game");
};
