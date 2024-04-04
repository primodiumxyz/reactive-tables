import { removeAllTweens } from "@latticexyz/phaserx";
import { PixelCoord } from "@latticexyz/phaserx/src/types";
import { observable, runInAction } from "mobx";

import { isRectangle, isSprite, isGraphics, isBitmapText } from "../util/guards";
import { EmbodiedEntity, GameObject, GameObjectComponent, GameObjectFunction, GameObjectTypes } from "../../types";

export function createEmbodiedEntity<Type extends keyof GameObjectTypes>(
  id: string,
  group: Phaser.GameObjects.Group,
  type: Type,
  ignoreCulling = false,
  currentCameraFilter = 0
): EmbodiedEntity<Type> {
  const position: PixelCoord = observable({ x: 0, y: 0 });
  const onOnce = new Map<string, GameObjectFunction<Type>>();
  const onUpdate = new Map<string, GameObjectFunction<Type>>();
  const onExit = new Map<string, GameObjectFunction<Type>>();
  let activeGameObject: GameObject<Type> | undefined;
  const cameraFilter = { current: currentCameraFilter };

  function getGameObject() {
    return activeGameObject;
  }

  function modifiesPosition<Type extends keyof GameObjectTypes>(
    func: GameObjectFunction<Type>
  ): Partial<PixelCoord> | undefined {
    let newPosition: Partial<PixelCoord> | undefined = undefined;

    const gameObjectProxy = new Proxy(
      { x: undefined, y: undefined },
      {
        get: (_, prop) => {
          if (prop === "setPosition") return (x: number, y: number) => (newPosition = { x, y });
          if (prop === "setX") return (x: number) => (newPosition = { x });
          if (prop === "setY") return (y: number) => (newPosition = { y });
          return () => void 0;
        },
        set: (_, prop, value) => {
          if (prop === "x") newPosition = newPosition ? { ...newPosition, x: value } : { x: value };
          if (prop === "y") newPosition = newPosition ? { ...newPosition, y: value } : { y: value };
          return true;
        },
      }
    );
    func(gameObjectProxy as GameObject<Type>, 0, 0);
    return newPosition;
  }

  /**
   * Syncronizes updates to game object positions to the EmbodiedEntity's position
   */
  // function trackPositionUpdates(func: GameObjectFunction<Type>): GameObjectFunction<Type> {
  // return func;
  // if (!modifiesPosition(func)) return func;

  // return (gameObject, time, delta) => {
  //   func(gameObject, time, delta);
  //   runInAction(() => {
  //     position.x = gameObject.x;
  //     position.y = gameObject.y;
  //   });
  // };
  // }

  /**
   * Stores and executes the component.
   * Once and Update functions are stored.
   * Now and Once functions are executed if there is an active game object.
   * Now is executed first and awaited, before Once is executed.
   * @param component: GameObjectComponent definition, including id, and optional functions for now, once and update
   */
  async function setComponent({
    id,
    modifiesPosition: _modifiesPosition = false,
    now,
    once,
    update,
    exit,
  }: GameObjectComponent<Type>) {
    // Handle position update when setting the component
    if (_modifiesPosition) {
      const newPosition = once && modifiesPosition(once);
      if (newPosition) {
        runInAction(() => {
          position.x = newPosition.x ?? position.x;
          position.y = newPosition.y ?? position.y;
        });
      }
    }

    // Store functions
    once && onOnce.set(id, once);
    update && onUpdate.set(id, update);
    exit && onExit.set(id, exit);

    // Execute functions
    if (activeGameObject && now) {
      await now(activeGameObject, 0, 0);
    }

    if (activeGameObject && once) once(activeGameObject, 0, 0);
  }

  function hasComponent(id: string): boolean {
    return onOnce.has(id) || onUpdate.has(id) || onExit.has(id);
  }

  function removeComponent(id: string, stop?: boolean) {
    // Execute exit functions
    if (activeGameObject) {
      if (onExit.has(id)) {
        onExit.get(id)?.(activeGameObject, 0, 0);
        onOnce.delete(id);
        onUpdate.delete(id);
        onExit.delete(id);
        return;
      }
      executeGameObjectFunctions(activeGameObject, onExit.values());
    }

    onOnce.delete(id);
    onUpdate.delete(id);
    onExit.delete(id);

    // Reset the entity and reapply all onOnce components
    if (activeGameObject) {
      reset(activeGameObject, stop);
      executeGameObjectFunctions(activeGameObject, onOnce.values());
    }
  }

  async function setComponents(components: (GameObjectComponent<Type> | undefined)[]) {
    for (const component of components) {
      if (!component) continue;
      await setComponent(component);
    }
  }

  function reset(gameObject: GameObject<Type>, stop = true) {
    if (stop) {
      if (isSprite(gameObject, type)) gameObject.stop();
      removeAllTweens(gameObject);
    }
    gameObject.setDepth(0);
    gameObject.cameraFilter = cameraFilter.current;
    gameObject.resetPipeline(true);
    gameObject.setScale(1, 1);
    gameObject.setAlpha(1);
    gameObject.setRotation(0);
    gameObject.setScrollFactor(1);
    gameObject.clearMask();
    gameObject.setData("objectPoolId", null);
    gameObject.removeAllListeners();

    //set Origin does not exist on graphics
    if (!isGraphics(gameObject, type)) gameObject.setOrigin(0, 0);

    if (isGraphics(gameObject, type)) {
      gameObject.clear();
    }

    if (isBitmapText(gameObject, type)) {
      gameObject.setText("");
    }

    if (isSprite(gameObject, type)) {
      gameObject.clearTint();
      gameObject.setTexture("");
      // gameObject.postFX?.clear();
      gameObject.clearFX();
    }
    if (isRectangle(gameObject, type)) {
      gameObject.width = 0;
      gameObject.height = 0;
    }
  }

  function setCameraFilter(filter: number) {
    cameraFilter.current = filter;
    if (activeGameObject) activeGameObject.cameraFilter = filter;
  }

  function handleUpdate(time: number, delta: number) {
    if (activeGameObject) {
      for (const func of onUpdate.values()) {
        func(activeGameObject, time, delta);
      }
    }
  }

  function spawn() {
    if (activeGameObject) return;
    const gameObject: GameObject<Type> = group.get();
    reset(gameObject);

    // Run all functions that are supposed to run once
    executeGameObjectFunctions(gameObject, onOnce.values());

    // Linking the update method to the scene's update loop
    gameObject.scene.events.on("update", handleUpdate);

    gameObject.setActive(true);
    gameObject.setVisible(true);
    gameObject.setData("objectPoolId", id);

    activeGameObject = gameObject;
  }

  function despawn(force = false) {
    if (ignoreCulling && !force) return;

    if (activeGameObject) {
      // Deregister the update handler
      activeGameObject.scene.events.off("update", handleUpdate);

      // Run exit funcitons
      executeGameObjectFunctions(activeGameObject, onExit.values());

      group.killAndHide(activeGameObject);
    }
    activeGameObject = undefined;
  }

  return {
    setComponent,
    setComponents,
    hasComponent,
    removeComponent,
    getGameObject,
    reset: (stop?: boolean) => {
      if (activeGameObject) {
        reset(activeGameObject, stop);
        executeGameObjectFunctions(activeGameObject, onOnce.values());
      }
    },
    spawn,
    despawn,
    position,
    id,
    setCameraFilter,
    type,
  };
}

function executeGameObjectFunctions<Type extends keyof GameObjectTypes>(
  gameObject: GameObject<Type>,
  functions: Iterable<GameObjectFunction<Type>>
) {
  if (!gameObject) return;

  for (const func of functions) {
    func(gameObject, 0, 0);
  }
}
