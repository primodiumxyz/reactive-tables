import { Entity } from "@latticexyz/recs";
import { Store } from "tinybase/store";

export const createComponentMethodsUtils = (store: Store, tableId: string) => {
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

export const arrayToIterator = <T>(array: T[]): IterableIterator<T> => {
  let i = 0;

  const iterator: Iterator<T> = {
    next() {
      if (i >= array.length) return { done: true, value: undefined };
      return { done: false, value: array[i++] };
    },
  };

  const iterable: IterableIterator<T> = {
    ...iterator,
    [Symbol.iterator]() {
      return this;
    },
  };

  return iterable;
};
