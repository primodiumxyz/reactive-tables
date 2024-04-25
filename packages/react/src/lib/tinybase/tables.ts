import { $Record, TinyBaseStore } from "@/lib";

export const createTableMethodsUtils = (store: TinyBaseStore, tableId: string) => {
  const paused = {
    set: ($Record: $Record, paused: boolean) => {
      store.setValue(`paused__${tableId}__${$Record}`, paused);
    },
    get: ($Record: $Record) => {
      return store.getValue(`paused__${tableId}__${$Record}`);
    },
  };

  return { paused };
};
