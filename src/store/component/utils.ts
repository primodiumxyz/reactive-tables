import { Entity, Schema } from "@latticexyz/recs";
import { Row, Store } from "tinybase/store";

import { TinyBaseAdapter } from "@/adapter";
import { TinyBaseFormattedType } from "@/adapter/formatValueForTinyBase";
import { ComponentUpdate } from "./createComponentMethods";

export const createComponentMethodsUtils = (store: Store, tableId: string) => {
  const paused = {
    set: (entity: Entity, paused: boolean) => {
      store.setValue(`paused__${tableId}__${entity}`, paused);
    },
    get: (entity: Entity) => {
      return store.getValue(`paused__${tableId}__${entity}`);
    },
  };

  const pendingUpdate = {
    set: <S extends Schema, T = unknown>(entity: Entity, pendingUpdate: ComponentUpdate<S, T>) => {
      // Format values for storage
      const currentValueFormatted = pendingUpdate.value.current
        ? TinyBaseAdapter.format(Object.keys(pendingUpdate.value.current), Object.values(pendingUpdate.value.current))
        : undefined;
      const prevValueFormatted = pendingUpdate.value.prev
        ? TinyBaseAdapter.format(Object.keys(pendingUpdate.value.prev), Object.values(pendingUpdate.value.prev))
        : undefined;

      // Create the table with only defined values
      const table = Object.fromEntries(
        Object.entries({
          current: currentValueFormatted,
          prev: prevValueFormatted,
        }).filter(([_, value]) => !!value),
      ) as Record<string, TinyBaseFormattedType>;

      // Update the store
      store.setTable(`pendingUpdate__${tableId}__${entity}`, table);
    },
    setRaw: (entity: Entity, current: Row | undefined, prev: Row | undefined) => {
      const table = Object.fromEntries(
        Object.entries({
          current,
          prev,
        }).filter(([_, value]) => !!value),
      ) as Record<string, Row>;

      store.setTable(`pendingUpdate__${tableId}__${entity}`, table);
    },
    delete: (entity: Entity) => {
      store.delTable(`pendingUpdate__${tableId}__${entity}`);
    },
    get: (entity: Entity) => {
      const table = store.getTable(`pendingUpdate__${tableId}__${entity}`);
      const rows = [table["current"], table["prev"]];
      const decoded = rows.map((row) => (row ? TinyBaseAdapter.parse(row) : undefined));
      return {
        decoded: { current: decoded[0], prev: decoded[1] },
        raw: Object.entries(table).length > 0 ? { current: table["current"], prev: table["prev"] } : undefined,
      };
    },
    getRaw: (entity: Entity) => {
      const table = store.getTable(`pendingUpdate__${tableId}__${entity}`);
      return Object.entries(table).length > 0 ? { current: table["current"], prev: table["prev"] } : undefined;
    },
  };

  return { paused, pendingUpdate };
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
