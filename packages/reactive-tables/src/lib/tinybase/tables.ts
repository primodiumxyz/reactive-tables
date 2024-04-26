import { $Record, TinyBaseStore } from "@/lib";

/**
 * Create methods to handle the paused state of a table.
 *
 * @param store The regular TinyBase store.
 * @param tableId The id of the table for which to handle the paused status.
 * @returns The paused state methods (`set` and `get`).
 * @category Tables
 */
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
