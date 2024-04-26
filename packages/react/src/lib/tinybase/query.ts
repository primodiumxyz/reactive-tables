import { GetResultCellChange, ResultRow } from "tinybase/queries";

import { Properties } from "@/tables";
import { UpdateType } from "@/queries";
import { TinyBaseAdapter, TinyBaseFormattedType } from "@/adapter";
import { $Record, Schema, localProperties, metadataProperties } from "@/lib";

// Get accurate new and previous properties, and the corresponding type of update, from the changes in a row
export const getPropsAndTypeFromRowChange = <S extends Schema, T = unknown>(
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
  const newProps =
    type === "exit" ? undefined : (TinyBaseAdapter.decode(newRow as TinyBaseFormattedType) as Properties<S, T>);
  const prevProps =
    type === "enter" ? undefined : (TinyBaseAdapter.decode(previousRow as TinyBaseFormattedType) as Properties<S, T>);

  return { tableId, $record, properties: { current: newProps, prev: prevProps }, type };
};
