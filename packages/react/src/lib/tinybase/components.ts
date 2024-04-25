import { Entity } from "@latticexyz/recs";

import { TinyBaseStore } from "@/lib";

export const createComponentMethodsUtils = (store: TinyBaseStore, tableId: string) => {
  const paused = {
    set: (entity: Entity, paused: boolean) => {
      store.setValue(`paused__${tableId}__${entity}`, paused);
    },
    get: (entity: Entity) => {
      return store.getValue(`paused__${tableId}__${entity}`);
    },
  };

  return { paused };
};
