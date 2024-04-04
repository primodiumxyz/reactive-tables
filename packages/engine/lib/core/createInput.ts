// MODIFIED FROM LATTICEXYZ/PHASERX
// https://github.com/latticexyz/mud/blob/main/packages/phaserx/src/createInput.ts

import { Observable, Subject, bufferCount, filter, fromEvent, map, merge, throttleTime } from "rxjs";
import { observable, reaction, runInAction } from "mobx";
import Phaser from "phaser";
import { Key } from "../../types";

export function createInput(inputPlugin: Phaser.Input.InputPlugin) {
  const disposers = new Set<() => void>();
  const phaserKeys = new Map<Key, Phaser.Input.Keyboard.Key>();
  const enabled = { current: true };

  inputPlugin.mouse?.disableContextMenu();

  function disableInput() {
    enabled.current = false;
    if (!phaserKeyboard) return;

    phaserKeyboard.disableGlobalCapture();
    phaserKeyboard.enabled = false;
    inputPlugin.enabled = false;
  }

  function enableInput() {
    enabled.current = true;
    if (!phaserKeyboard) return;

    phaserKeyboard?.enableGlobalCapture();
    phaserKeyboard.enabled = true;
    inputPlugin.enabled = true;
  }

  function setCursor(cursor: string) {
    inputPlugin.setDefaultCursor(cursor);
  }

  const keyboard$ = new Subject<Phaser.Input.Keyboard.Key>();

  const pointermove$ = fromEvent(inputPlugin.scene.scale.canvas, "mousemove").pipe(
    filter(() => enabled.current && inputPlugin.scene.scene.isActive()),
    map(() => {
      inputPlugin.manager.activePointer.updateWorldPoint(inputPlugin.scene.cameras.main);
      return inputPlugin.manager?.activePointer;
    })
    // filter(({ pointer }) => pointer?.downElement?.nodeName === "CANVAS"),
    // filterNullish()
  );

  const pointerdown$: Observable<{
    pointer: Phaser.Input.Pointer;
    event: MouseEvent;
  }> = fromEvent(inputPlugin.scene.scale.canvas, "pointerdown").pipe(
    filter(() => enabled.current && inputPlugin.scene.scene.isActive()),
    map((event) => ({
      pointer: inputPlugin.manager?.activePointer,
      event: event as MouseEvent,
    }))
  );

  const pointerup$: Observable<{
    pointer: Phaser.Input.Pointer;
    event: MouseEvent;
  }> = fromEvent(inputPlugin.scene.scale.canvas, "pointerup").pipe(
    filter(() => enabled.current && inputPlugin.scene.scene.isActive()),
    map((event) => ({
      pointer: inputPlugin.manager?.activePointer,
      event: event as MouseEvent,
    }))
  );

  // Click stream
  const click$ = merge(pointerdown$, pointerup$).pipe(
    filter(() => enabled.current && inputPlugin.scene.scene.isActive()),
    map<{ pointer: Phaser.Input.Pointer; event: MouseEvent }, [boolean, number]>(({ event }) => [
      event.type === "pointerdown",
      Date.now(),
    ]), // Map events to whether the left button is down and the current timestamp
    bufferCount(2, 1), // Store the last two timestamps
    filter(([prev, now]) => prev[0] && !now[0] && now[1] - prev[1] < 150), // Only care if button was pressed before and is not anymore and it happened within 500ms
    map((): [Phaser.Input.Pointer, Phaser.GameObjects.GameObject[]] => {
      const pointer = inputPlugin.manager.activePointer;
      const hitTestResults = inputPlugin.hitTestPointer(pointer);
      return [pointer, hitTestResults];
    }), // Return the current pointer
    filter(([pointer]) => pointer?.downElement?.nodeName === "CANVAS")
  );

  // Double click stream
  const doubleClick$ = pointerdown$.pipe(
    filter(() => enabled.current && inputPlugin.scene.scene.isActive()),
    map(() => ({
      time: Date.now(),
    })),
    bufferCount(2, 1),
    filter(([prev, now]) => {
      const timeDiff = now.time - prev.time;
      return timeDiff < 250 && timeDiff > 20;
    }),
    throttleTime(250),
    map(() => inputPlugin.manager?.activePointer),
    filter((pointer) => pointer?.downElement?.nodeName === "CANVAS")
  );

  // Right click stream
  const rightClick$ = merge(pointerdown$, pointerup$).pipe(
    filter(({ pointer }) => enabled.current && pointer.rightButtonDown() && inputPlugin.scene.scene.isActive()),
    map(() => inputPlugin.manager?.activePointer), // Return the current pointer
    filter((pointer) => pointer?.downElement?.nodeName === "CANVAS")
  );

  const pressedKeys = observable(new Set<Key>());
  const phaserKeyboard = inputPlugin.keyboard;
  const codeToKey = new Map<number, Key>();

  // Listen to all keys
  for (const key of Object.keys(Phaser.Input.Keyboard.KeyCodes)) addKey(key);

  // Subscriptions
  const keySub = keyboard$
    .pipe(filter(() => enabled.current && inputPlugin.scene.scene.isActive()))
    .subscribe((key) => {
      const keyName = codeToKey.get(key.keyCode);
      if (!keyName) return;
      runInAction(() => {
        if (key.isDown) pressedKeys.add(keyName);
        if (key.isUp) pressedKeys.delete(keyName);
      });
    });
  disposers.add(() => keySub?.unsubscribe());

  const pointerSub = merge(pointerdown$, pointerup$).subscribe(({ pointer }) => {
    runInAction(() => {
      if (pointer.leftButtonDown()) pressedKeys.add("POINTER_LEFT");
      else pressedKeys.delete("POINTER_LEFT");

      if (pointer.rightButtonDown()) pressedKeys.add("POINTER_RIGHT");
      else pressedKeys.delete("POINTER_RIGHT");
    });
    //
  });
  disposers.add(() => pointerSub?.unsubscribe());

  // Adds a key to include in the state
  function addKey(key: string) {
    if (!phaserKeyboard) {
      console.warn(`Adding key ${key} failed. No phaser keyboard detected.`);
      return;
    }

    // Add the key to the phaser keyboard input plugin
    const keyObj = phaserKeyboard.addKey(key, false);
    // Store the cleartext key map
    codeToKey.set(keyObj.keyCode, key as Key);

    //store the phaser key object
    phaserKeys.set(key as Key, keyObj);

    keyObj.removeAllListeners();
    keyObj.emitOnRepeat = true;
    keyObj.on("down", (keyEvent: Phaser.Input.Keyboard.Key) => keyboard$.next(keyEvent));
    keyObj.on("up", (keyEvent: Phaser.Input.Keyboard.Key) => keyboard$.next(keyEvent));
  }

  function onKeyPress(keySelector: (pressedKeys: Set<Key>) => boolean, callback: () => void) {
    const disposer = reaction(
      () => keySelector(pressedKeys),
      (passes) => {
        if (passes) callback();
      },
      { fireImmediately: true }
    );
    disposers.add(disposer);
  }

  function dispose() {
    inputPlugin.removeAllListeners();
    for (const disposer of disposers) {
      disposer();
    }
  }

  return {
    keyboard$: keyboard$.asObservable(),
    pointermove$,
    pointerdown$,
    pointerup$,
    click$,
    phaserInput: inputPlugin,
    phaserKeys,
    doubleClick$,
    rightClick$,
    pressedKeys,
    dispose,
    disableInput,
    enableInput,
    setCursor,
    enabled,
    onKeyPress,
  };
}

export default createInput;
