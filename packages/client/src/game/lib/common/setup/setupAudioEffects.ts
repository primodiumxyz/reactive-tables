import { AudioKeys } from "@game/constants";
import { defineComponentSystem, namespaceWorld } from "@latticexyz/recs";
import { Scene } from "engine/types";
import { createAudioApi } from "src/game/api/audio";
import { components } from "src/network/components";
import { world } from "src/network/world";
import { getRandomRange } from "src/util/common";

export const setupAudioEffects = (scene: Scene) => {
  const audio = createAudioApi(scene);
  const gameWorld = namespaceWorld(world, "game");

  defineComponentSystem(gameWorld, components.HoverEntity, ({ value }) => {
    if (!value[0]) return;

    audio.play(AudioKeys.DataPoint2, "ui", {
      volume: 0.1,
      detune: getRandomRange(-200, 200),
    });
  });

  defineComponentSystem(
    gameWorld,
    components.SelectedRock,
    ({ value }) => {
      if (!value[0] || value[0]?.value === value[1]?.value) return;

      if (value[0].value === components.SelectedRock.get()?.value && !components.MapOpen.get()?.value) {
        return;
      }

      audio.play(AudioKeys.Confirm, "ui", {
        volume: 0.5,
        detune: getRandomRange(-50, 50),
      });
    },
    {
      runOnInit: false,
    }
  );
};
