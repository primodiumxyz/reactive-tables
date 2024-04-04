import { throttle } from "lodash";

import { KeybindActions } from "@game/constants";
import { Key, Scene } from "engine/types";
import { usePersistentStore } from "../stores/PersistentStore";

export function createInputApi(targetScene: Scene) {
  const keybinds = usePersistentStore.getState().keybinds;
  function isDown(keybindAction: KeybindActions) {
    const { input } = targetScene;

    if (!keybinds[keybindAction]) return false;

    if (KeybindActions.LeftClick === keybindAction) {
      if (input.phaserInput.activePointer.downElement?.nodeName !== "CANVAS") return false;
      return input.phaserInput.activePointer.leftButtonDown();
    }

    if (KeybindActions.RightClick === keybindAction) {
      if (input.phaserInput.activePointer.downElement?.nodeName !== "CANVAS") return false;
      return input.phaserInput.activePointer.rightButtonDown();
    }

    for (const key of keybinds[keybindAction]!) {
      if (input.phaserKeys.get(key as Key)?.isDown) {
        return true;
      }
    }

    return false;
  }

  function isUp(keybindAction: KeybindActions) {
    const keybinds = usePersistentStore.getState().keybinds;
    const { input } = targetScene;

    if (!keybinds[keybindAction]) return false;

    if (KeybindActions.LeftClick === keybindAction) {
      return input.phaserInput.activePointer.leftButtonReleased();
    }

    if (KeybindActions.RightClick === keybindAction) {
      return input.phaserInput.activePointer.rightButtonReleased();
    }

    for (const key of keybinds[keybindAction]!) {
      if (input.phaserKeys.get(key as Key)?.isUp) {
        return true;
      }
    }

    return false;
  }

  function addListener(KeybindActions: KeybindActions, callback: () => void, emitOnRepeat = false, wait = 0) {
    const keybinds = usePersistentStore.getState().keybinds;
    const { input } = targetScene;

    const fn = throttle(callback, wait);

    for (const key of keybinds[KeybindActions]!) {
      input.phaserKeys
        .get(key as Key)
        ?.on("down", fn)
        .setEmitOnRepeat(emitOnRepeat);
    }

    return {
      dispose: () => {
        for (const key of keybinds[KeybindActions]!) {
          input.phaserKeys.get(key as Key)?.removeListener("down", fn);
        }
      },
    };
  }

  function transferListeners(oldKey: Key, newKey: Key) {
    const { input } = targetScene;

    const oldPhaserKey = input.phaserKeys.get(oldKey);
    const newPhaserKey = input.phaserKeys.get(newKey);

    if (!oldPhaserKey || !newPhaserKey) return;

    const events = oldPhaserKey.listeners("down");
    if (!events.length) return;

    const emitOnRepeat = oldPhaserKey.emitOnRepeat;

    oldPhaserKey.removeAllListeners();

    newPhaserKey.removeAllListeners().setEmitOnRepeat(emitOnRepeat);

    for (const event of events) {
      newPhaserKey.on("down", event);
    }
  }

  function removeListeners(key: Key) {
    const { input } = targetScene;

    const phaserKey = input.phaserKeys.get(key);

    if (!phaserKey) return;

    phaserKey.removeAllListeners();
  }

  function disableInput() {
    const { input } = targetScene;

    input.disableInput();
  }

  function enableInput() {
    const { input } = targetScene;

    input.enableInput();
  }

  return {
    isDown,
    isUp,
    addListener,
    transferListeners,
    removeListeners,
    disableInput,
    enableInput,
  };
}
