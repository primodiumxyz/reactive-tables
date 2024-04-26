import { Hex } from "viem";

import { PropsSchema } from "@/tables/contract";
import { TinyBaseStore } from "@/lib";

/**
 * Store the properties schema of a table inside the TinyBase store.
 *
 * Note: This is done when creating a contract table, to be able to later access this schema given a table id.
 *
 * @param store The regular TinyBase store.
 * @param tableId The id of the table for which all rows follow the provided schema.
 * @param propsSchema The schema of the properties to store.
 * @category Adapter
 */
export const storePropertiesSchema = (store: TinyBaseStore, tableId: Hex, propsSchema: PropsSchema) => {
  store.setTable(`table__${tableId}`, {
    propsSchema,
  });
};

/**
 * Get the properties schema of a table stored inside the TinyBase store.
 *
 * Note: This is used when decoding logs inside the storage adapter, as it requires the properties schema to decode each property.
 *
 * @param store The regular TinyBase store.
 * @param tableId The id of the table for which to get the properties schema.
 * @returns The properties schema of the table.
 * @category Adapter
 */
export const getPropertiesSchema = (store: TinyBaseStore, tableId: Hex): PropsSchema => {
  const row = store.getRow(`table__${tableId}`, "propsSchema");
  if (Object.keys(row).length === 0) throw new Error(`Table with id ${tableId} is empty`);

  return row as PropsSchema;
};
