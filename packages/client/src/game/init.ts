import engine from "engine";
import gameConfig from "./config/game";
import { Scenes } from "./constants";
import { initAsteroidScene } from "./lib/asteroid/init";
import { setupAudioEffects } from "./lib/common/setup/setupAudioEffects";
import { initStarmapScene } from "./lib/starmap/init";
import { initUIScene } from "./lib/ui/init";

async function init() {
  const game = await engine.createGame(gameConfig);

  await initAsteroidScene(game);
  await initStarmapScene(game);
  await initUIScene(game);

  setupAudioEffects(game.sceneManager.scenes.get(Scenes.Asteroid)!);
}

export default init;
