import { ValueSchema } from "@latticexyz/protocol-parser/internal";
import { Hex } from "viem";

import { TinyBaseStore } from "@/lib";

// Utility to store a value schema and access it efficiently in the storage adapter
export const storeValueSchema = (store: TinyBaseStore, tableId: Hex, valueSchema: ValueSchema) => {
  store.setTable(`table__${tableId}`, {
    valueSchema: valueSchema,
  });
};

export const getValueSchema = (store: TinyBaseStore, tableId: Hex): ValueSchema => {
  const row = store.getRow(`table__${tableId}`, "valueSchema");
  if (Object.keys(row).length === 0) throw new Error(`Table with id ${tableId} is empty`);

  return row as ValueSchema;
};
