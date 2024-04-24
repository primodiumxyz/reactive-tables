import { Entity } from "@latticexyz/recs";
import { ValueSchema } from "@latticexyz/protocol-parser/internal";
import { Hex } from "viem";
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

// Utility to store a value schema and access it efficiently in the storage adapter
export const storeValueSchema = (store: Store, tableId: Hex, valueSchema: ValueSchema) => {
  store.setTable(`table__${tableId}`, {
    valueSchema: valueSchema,
  });
};

export const getValueSchema = (store: Store, tableId: Hex): ValueSchema => {
  const row = store.getRow(`table__${tableId}`, "valueSchema");
  if (Object.keys(row).length === 0) throw new Error(`Table with id ${tableId} is empty`);

  return row as ValueSchema;
};
