// UI MAP ENTRY POINT
import { AudioKeys, Scenes } from "@game/constants";
import { Game } from "engine/types";
import { createAudioApi } from "src/game/api/audio";
import { world } from "src/network/world";
import { uiSceneConfig } from "src/game/config/uiScene";
import { defineComponentSystem } from "@latticexyz/recs";
import { components } from "src/network/components";

export const initUIScene = async (game: Game) => {
  const scene = await game.sceneManager.addScene(uiSceneConfig, true);
  const audio = createAudioApi(scene);
  audio.initializeAudioVolume();
  scene.phaserScene.scene.bringToTop(Scenes.UI);

  audio.play(AudioKeys.Background, "music");
  audio.play(AudioKeys.Background2, "music", {
    loop: true,
    volume: 0,
  });
  audio.setPauseOnBlur(false);
  const bg = audio.get(AudioKeys.Background, "music");
  const bg2 = audio.get(AudioKeys.Background2, "music");

  defineComponentSystem(world, components.MapOpen, ({ value }) => {
    if (!bg || !bg2) return;

    if (value[0]?.value) {
      scene.phaserScene.add.tween({
        targets: bg,
        volume: 0,
        duration: 3000,
      });

      scene.phaserScene.add.tween({
        targets: bg2,
        volume: 1,
        duration: 3000,
      });
    } else {
      scene.phaserScene.add.tween({
        targets: bg,
        volume: 1,
        duration: 3000,
      });

      scene.phaserScene.add.tween({
        targets: bg2,
        volume: 0,
        duration: 3000,
      });
    }
  });

  world.registerDisposer(() => {
    game.dispose();
  }, "game");
};
