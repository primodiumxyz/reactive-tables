import type { GetResultCellChange, ResultRow } from "tinybase/queries";

import type { Properties } from "@/tables";
import type { UpdateType } from "@/queries";
import { TinyBaseAdapter, type TinyBaseFormattedType } from "@/adapter";
import { type $Record, type Schema, localProperties, metadataProperties } from "@/lib";

/**
 * Get the current and previous properties, and infer the type of update from a row change.
 *
 * This uses the TinyBase store {@link GetResultCellChange} function to retrieve the specific changes in a cell.
 *
 * @param getCellChange Native TinyBase function to get the changes in a cell.
 * @param keys The list of keys for each cell to get the changes for (to get the full properties object).
 * @param tableId The id of the table.
 * @param $record The record that changed.
 * @returns The id of the table, the record, the properties object with the current and previous properties, and the type of update.
 * @category Queries
 */
export const getPropertiesAndTypeFromRowChange = <S extends Schema, T = unknown>(
  getCellChange: GetResultCellChange,
  keys: string[],
  tableId: string,
  $record: $Record,
) => {
  let type = "change" as UpdateType;
  // Add the type information to the keys
  keys = keys
    .map((key) => (metadataProperties.includes(key) ? key : [key, `type__${key}`]))
    .flat()
    // Add any internal keys (utilities)
    .concat(localProperties);

  // Get the old and new rows
  const { current: newRow, prev: previousRow } = keys.reduce(
    (acc, key) => {
      const [, oldValueAtKey, newValueAtKey] = getCellChange(tableId, $record, key);
      acc.current[key] = newValueAtKey as ResultRow[typeof key];
      acc.prev[key] = oldValueAtKey as ResultRow[typeof key];

      return acc;
    },
    { current: {}, prev: {} } as { current: ResultRow; prev: ResultRow },
  );

  // Find if it's an entry or an exit
  if (Object.values(newRow).every((v) => v === undefined)) {
    type = "exit";
  } else if (Object.values(previousRow).every((v) => v === undefined)) {
    type = "enter";
  }

  // Parse the properties
  const newProperties =
    type === "exit" ? undefined : (TinyBaseAdapter.decode(newRow as TinyBaseFormattedType) as Properties<S, T>);
  const prevProperties =
    type === "enter" ? undefined : (TinyBaseAdapter.decode(previousRow as TinyBaseFormattedType) as Properties<S, T>);

  return { tableId, $record, properties: { current: newProperties, prev: prevProperties }, type };
};
