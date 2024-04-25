import { Hex } from "viem";

import { PropsSchema } from "@/tables/contract";
import { TinyBaseStore } from "@/lib";

// Utility to store a properties schema and access it efficiently in the storage adapter
export const storePropertiesSchema = (store: TinyBaseStore, tableId: Hex, propsSchema: PropsSchema) => {
  store.setTable(`table__${tableId}`, {
    propsSchema,
  });
};

export const getPropertiesSchema = (store: TinyBaseStore, tableId: Hex): PropsSchema => {
  const row = store.getRow(`table__${tableId}`, "propsSchema");
  if (Object.keys(row).length === 0) throw new Error(`Table with id ${tableId} is empty`);

  return row as PropsSchema;
};
