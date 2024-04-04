import {
  Component,
  ComponentUpdate,
  Entity,
  Metadata,
  QueryFragment,
  Schema,
  defineComponentSystem,
  defineEnterSystem,
  defineExitSystem,
  defineRxSystem,
  defineUpdateSystem,
  getComponentValue,
  namespaceWorld,
} from "@latticexyz/recs";
import { Coord, uuid } from "@latticexyz/utils";
import { GameObjectComponent, GameObjectTypes, Scene } from "engine/types";
import { Observable } from "rxjs";
import { world } from "src/network/world";

type GameObjectInstances = {
  [K in keyof GameObjectTypes]: InstanceType<GameObjectTypes[K]>;
};

type SystemCallback<T extends keyof GameObjectTypes, S extends Schema = Schema> = (
  gameObject: InstanceType<GameObjectTypes[T]>,
  update: ComponentUpdate<S>,
  systemId: string //manage callback lifecycle
) => void;

type ComponentSystemMap = Map<Component<Schema, Metadata>, Map<string, (update: ComponentUpdate<Schema>) => void>>;

type QuerySystemMap = Map<QueryFragment[], Map<string, (update: ComponentUpdate<Schema>) => void>>;

const gameWorld = namespaceWorld(world, "game");

function updateGameObject<T extends keyof GameObjectTypes>(
  gameObject: GameObjectInstances[T],
  properties: Partial<GameObjectInstances[T]>
): void {
  for (const key in properties) {
    if (key in gameObject) {
      gameObject[key as keyof GameObjectInstances[T]] = properties[key as keyof GameObjectInstances[T]]!;
    }
  }
}

export const ObjectPosition = <T extends keyof GameObjectTypes>(
  coord: Coord,
  depth?: number
): GameObjectComponent<T> => {
  return {
    id: uuid(),
    modifiesPosition: true,
    once: (gameObject) => {
      gameObject.x = coord.x;
      gameObject.y = coord.y;

      if (depth) gameObject.setDepth(depth);
    },
  };
};

export const SetValue = <T extends keyof GameObjectTypes>(
  properties: Partial<GameObjectInstances[T]>
): GameObjectComponent<T> => {
  return {
    id: uuid(),
    once: (gameObject) => {
      updateGameObject(gameObject as GameObjectInstances[T], properties);
    },
  };
};

export const OnClick = <T extends keyof GameObjectTypes>(
  scene: Scene,
  callback: (gameObject?: GameObjectInstances[T], e?: Phaser.Input.Pointer) => void,
  pixelPerfect = false
): GameObjectComponent<T> => {
  return {
    id: uuid(),
    once: (gameObject) => {
      if (pixelPerfect) gameObject.setInteractive(scene.input.phaserInput.makePixelPerfect());
      else gameObject.setInteractive();

      gameObject.on("pointerdown", (e: Phaser.Input.Pointer) => {
        if (e.downElement.nodeName !== "CANVAS") return;
        callback(gameObject as GameObjectInstances[T], e);
      });
    },
  };
};

export const OnClickUp = <T extends keyof GameObjectTypes>(
  scene: Scene,
  callback: (gameObject?: GameObjectInstances[T], e?: Phaser.Input.Pointer) => void,
  pixelPerfect = false
): GameObjectComponent<T> => {
  return {
    id: uuid(),
    once: (gameObject) => {
      if (pixelPerfect) gameObject.setInteractive(scene.input.phaserInput.makePixelPerfect());
      else gameObject.setInteractive();
      let downTime = Date.now();
      gameObject.on("pointerdown", () => (downTime = Date.now()));
      gameObject.on("pointerup", (e: Phaser.Input.Pointer) => {
        if (e.downElement.nodeName !== "CANVAS") return;
        const prevDownTime = downTime;
        downTime = Date.now();
        if (downTime - prevDownTime < 250) {
          callback(gameObject as GameObjectInstances[T], e);
        }
      });
    },
  };
};

export const OnHover = <T extends keyof GameObjectTypes>(
  callback: (gameObject?: GameObjectInstances[T]) => void,
  leaveCallback?: (gameObject?: GameObjectInstances[T]) => void,
  pixelPerfect = false
): GameObjectComponent<T> => {
  return {
    id: uuid(),
    once: (gameObject) => {
      if (pixelPerfect) gameObject.setInteractive(gameObject.scene.input.makePixelPerfect());
      else gameObject.setInteractive();

      gameObject.on("pointerover", () => {
        callback(gameObject as GameObjectInstances[T]);
      });

      if (leaveCallback) {
        gameObject.on("pointerout", () => {
          leaveCallback(gameObject as GameObjectInstances[T]);
        });
      }
    },
  };
};

export const TweenCounter = <T extends keyof GameObjectTypes>(
  scene: Scene,
  config: Partial<Phaser.Types.Tweens.NumberTweenBuilderConfig>
): GameObjectComponent<T> => {
  let tween: Phaser.Tweens.Tween;
  return {
    id: uuid(),
    once: () => {
      tween = scene.phaserScene.tweens.addCounter({
        ...config,
      });
    },
    exit: () => {
      tween.stop();
      tween.destroy();
    },
  };
};

export const Tween = <T extends keyof GameObjectTypes>(
  scene: Scene,
  config: Partial<Phaser.Types.Tweens.TweenBuilderConfig>,
  id = uuid()
): GameObjectComponent<T> => {
  let tween: Phaser.Tweens.Tween;
  return {
    id,
    once: (gameObject) => {
      tween = scene.phaserScene.add.tween({
        targets: gameObject,
        ...config,
      });
    },
    exit: () => {
      tween.stop();
      tween.destroy();
    },
  };
};

const componentMap: ComponentSystemMap = new Map();
const sentInitialUpdate = new Map<Entity, boolean>();
export const OnComponentSystem = <T extends keyof GameObjectTypes, S extends Schema>(
  component: Component<S, Metadata>,
  callback: SystemCallback<T, S>,
  options?: { initialEntity?: Entity }
): GameObjectComponent<T> => {
  const id = uuid();

  return {
    id,
    once: (gameObject) => {
      if (!componentMap.has(component)) {
        componentMap.set(component, new Map());

        defineComponentSystem(gameWorld, component, (update) => {
          const fnMap = componentMap.get(component);

          if (!fnMap) return;

          //prevent infinite loops if functions themselves modify fn list
          const staticFnList = Array.from(fnMap.values());

          //run all functions for component
          for (const fn of staticFnList) {
            fn(update);
          }
        });
      }

      //subscribe to component updates
      componentMap.get(component)?.set(id, (update) => callback(gameObject, update as ComponentUpdate<S>, id));
      //send initial update if it missed it

      if (options?.initialEntity && !sentInitialUpdate.get(options.initialEntity)) {
        const entity = options.initialEntity;
        const value = getComponentValue(component, entity);

        callback(
          gameObject,
          {
            entity,
            value: [value, undefined],
            component,
          } as ComponentUpdate<S>,
          id
        );

        sentInitialUpdate.set(entity, true);
      }
    },
    exit: () => {
      //unsub from component updates
      componentMap.get(component)?.delete(id);
    },
  };
};

const enterMap: QuerySystemMap = new Map();
export const OnEnterSystem = <T extends keyof GameObjectTypes>(
  query: QueryFragment[],
  callback: SystemCallback<T>,
  options?: { runOnInit?: boolean }
): GameObjectComponent<T> => {
  const id = uuid();

  return {
    id,
    once: (gameObject) => {
      if (!enterMap.has(query)) {
        enterMap.set(query, new Map());

        defineEnterSystem(
          gameWorld,
          query,
          (update) => {
            const fnMap = enterMap.get(query);

            if (!fnMap) return;

            //prevent infinite loops if functions themselves modify fn list
            const staticFnList = Array.from(fnMap.values());

            //run all functions for component
            for (const fn of staticFnList) {
              fn(update);
            }
          },
          options
        );
      }
      //subscribe to component updates
      enterMap.get(query)?.set(id, (update) => callback(gameObject, update, id));
    },
    exit: () => {
      //unsub from component updates
      enterMap.get(query)?.delete(id);
    },
  };
};

const updateMap: QuerySystemMap = new Map();
export const OnUpdateSystem = <T extends keyof GameObjectTypes>(
  query: QueryFragment[],
  callback: SystemCallback<T>,
  options?: { runOnInit?: boolean }
): GameObjectComponent<T> => {
  const id = uuid();

  return {
    id,
    once: (gameObject) => {
      if (!updateMap.has(query)) {
        updateMap.set(query, new Map());

        defineUpdateSystem(
          gameWorld,
          query,
          (update) => {
            const fnMap = updateMap.get(query);

            if (!fnMap) return;

            //prevent infinite loops if functions themselves modify fn list
            const staticFnList = Array.from(fnMap.values());

            //run all functions for component
            for (const fn of staticFnList) {
              fn(update);
            }
          },
          options
        );
      }

      //subscribe to component updates
      updateMap.get(query)?.set(id, (update) => callback(gameObject, update, id));
    },
    exit: () => {
      //unsub from component updates
      updateMap.get(query)?.delete(id);
    },
  };
};

const exitMap: QuerySystemMap = new Map();
export const OnExitSystem = <T extends keyof GameObjectTypes>(
  query: QueryFragment[],
  callback: SystemCallback<T>,
  options?: { runOnInit?: boolean }
): GameObjectComponent<T> => {
  const id = uuid();

  return {
    id,
    once: (gameObject) => {
      if (!exitMap.has(query)) {
        exitMap.set(query, new Map());

        defineExitSystem(
          gameWorld,
          query,
          (update) => {
            const fnMap = exitMap.get(query);

            if (!fnMap) return;

            //prevent infinite loops if functions themselves modify fn list
            const staticFnList = Array.from(fnMap.values());

            //run all functions for component
            for (const fn of staticFnList) {
              fn(update);
            }
          },
          options
        );
      }

      //subscribe to component updates
      exitMap.get(query)?.set(id, (update) => callback(gameObject, update, id));
    },
    exit: () => {
      //unsub from component updates
      exitMap.get(query)?.delete(id);
    },
  };
};

type RxCallback<T extends keyof GameObjectTypes, E = unknown> = (
  gameObject: InstanceType<GameObjectTypes[T]>,
  update: E,
  systemId: string //manage callback lifecycle
) => void;

type RxSystemMap = Map<Observable<unknown>, Map<string, (update: unknown) => void>>;

const observableMap: RxSystemMap = new Map();
export const OnRxjsSystem = <T, GO extends keyof GameObjectTypes>(
  observable$: Observable<T>,
  callback: RxCallback<GO, T>
): GameObjectComponent<GO> => {
  const id = uuid();
  return {
    id,
    once: (gameObject) => {
      if (!observableMap.has(observable$)) {
        observableMap.set(observable$, new Map());

        defineRxSystem(gameWorld, observable$, (value) => {
          const fnMap = observableMap.get(observable$);

          if (!fnMap) return;

          //prevent infinite loops if functions themselves modify fn list
          const staticFnList = Array.from(fnMap.values());

          for (const fn of staticFnList) {
            fn(value);
          }
        });
      }
      observableMap.get(observable$)?.set(id, (update) => {
        callback(gameObject, update as T, id);
      });
    },
    exit: () => {
      observableMap.get(observable$)?.delete(id);
    },
  };
};

export const OnOnce = <T extends keyof GameObjectTypes>(
  callback: (gameObject: InstanceType<GameObjectTypes[T]>) => void
): GameObjectComponent<T> => {
  return {
    id: uuid(),
    once: (gameObject) => {
      callback(gameObject as InstanceType<GameObjectTypes[T]>);
    },
  };
};

export const OnExit = <T extends keyof GameObjectTypes>(
  callback: (gameObject: InstanceType<GameObjectTypes[T]>) => void
): GameObjectComponent<T> => {
  return {
    id: uuid(),
    exit: (gameObject) => {
      callback(gameObject as InstanceType<GameObjectTypes[T]>);
    },
  };
};

export const OnNow = <T extends keyof GameObjectTypes>(
  callback: (gameObject: InstanceType<GameObjectTypes[T]>) => void
): GameObjectComponent<T> => {
  return {
    id: uuid(),
    now: (gameObject) => {
      callback(gameObject as InstanceType<GameObjectTypes[T]>);
    },
  };
};
