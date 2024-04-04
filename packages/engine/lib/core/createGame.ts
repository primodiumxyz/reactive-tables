import { initializeContext } from "../../api";
import { createSceneManager } from "./createSceneManager";
import { deferred } from "@latticexyz/utils";
import { GameConfig } from "../../types";
import createPhaserScene from "../util/createPhaserScene";
import { getSceneLoadPromise } from "../util/getSceneLoadPromise";

export const createGame = async (config: GameConfig) => {
  //Initialize Phaser Game
  const phaserGame = new Phaser.Game(config);

  // Wait for phaser to boot
  const [resolve, , promise] = deferred();
  phaserGame.events.on("ready", resolve);
  await promise;

  // Create scene for loading assets
  const phaserScene = createPhaserScene({
    key: "ROOT",
    preload: async (scene: Phaser.Scene) => {
      scene.load.pack(config.key, config.assetPackUrl, config.key);
    },
  });

  const loadScene = new phaserScene();

  phaserGame.scene.add("ROOT", loadScene, true);
  loadScene.input.enabled = false;

  await getSceneLoadPromise(loadScene);

  /* -------------------------- Create Scene Manager -------------------------- */

  const sceneManager = createSceneManager(phaserGame);

  /* -------------------------------------------------------------------------- */
  const context = {
    phaserGame,
    sceneManager,
    dispose: () => {
      console.log(config.key + ": Disposing");
      phaserGame.destroy(true);
      sceneManager.dispose();
    },
  };

  initializeContext(config.key, context);

  console.log(config.key + ": Created Instance");

  return context;
};
