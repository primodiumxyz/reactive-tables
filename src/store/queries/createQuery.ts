import { Entity, Schema } from "@latticexyz/recs";
import { GetResultCellChange, Queries } from "tinybase/queries";

import { TinyBaseAdapter, TinyBaseFormattedType } from "@/adapter";
import { ComponentValue } from "@/store/component/types";
import { encodedDataKeys, internalKeys } from "@/constants";

/* ---------------------------------- TYPES --------------------------------- */
type ResultRow = { [key: string]: TinyBaseFormattedType[typeof key] | undefined };

export type UpdateType = "enter" | "exit" | "change";
export type TableQueryUpdate<S extends Schema, T = unknown> = {
  tableId: string;
  entity: Entity;
  value: { current: ComponentValue<S, T> | undefined; prev: ComponentValue<S, T> | undefined };
  type: UpdateType;
};

export type CreateQueryOptions<S extends Schema, T = unknown> = {
  queries: Queries;
  queryId: string;
  tableId: string;
  schema: S;
  // Opt in to any callback
  onChange?: (update: TableQueryUpdate<S, T>) => void;
  onEnter?: (update: TableQueryUpdate<S, T>) => void;
  onExit?: (update: TableQueryUpdate<S, T>) => void;
  options?: { runOnInit?: boolean };
};

export type CreateQueryResult = {
  unsubscribe: () => void;
};

// 1. Pass value schema (so we need schema for all components)
// 2. Get the keys
// 3. On change, getCellChange for each key, and get the current value
// 4. Figure out when getCellChange is undefined
// 5. Init type = updatetype or undefined
// 6. Set type depending on the values (new row undefined means exit, old row undefined means enter, both defined means change, getCellChange undefined means??) and set values as well

/* ---------------------------------- QUERY --------------------------------- */
// Create a listener associated with a query for a given table (or not), and run callbacks on enter, exit, and change
export const createQuery = <S extends Schema, T = unknown>({
  queries,
  queryId,
  tableId,
  schema,
  onChange,
  onEnter,
  onExit,
  options = { runOnInit: true },
}: CreateQueryOptions<S, T>) => {
  const store = queries.getStore();
  // Get the keys to be able to aggregate the full value from each cell
  const keys = Object.keys(schema);

  // Init listener
  const listenerId = queries.addResultRowListener(queryId, null, (_, __, entity: Entity, getCellChange) => {
    console.log("CHANGED");
    // Gather the value and type of the change
    const args = getValueAndTypeFromRowChange(getCellChange, keys, tableId, entity) as TableQueryUpdate<S, T>;

    // Run the callbacks
    if (args.type === "enter") {
      onEnter?.(args);
    } else if (args.type === "exit") {
      onExit?.(args);
    }

    onChange?.(args);
  });

  if (options.runOnInit) {
    const rows = store.getTable(tableId);

    // Run callbacks for all entities in the query
    queries.forEachResultRow(queryId, (entity) => {
      const value = TinyBaseAdapter.parse(rows[entity]) as ComponentValue<S, T>;

      const args = { tableId, entity, value: { current: value, prev: undefined }, type: "enter" as UpdateType };
      onEnter?.(args);
      onChange?.(args);
    });
  }

  return {
    unsubscribe: () => queries.delListener(listenerId),
  };
};

// Get accurate new and previous values, and the corresponding type of update, from the changes in a row
export const getValueAndTypeFromRowChange = <S extends Schema, T = unknown>(
  getCellChange: GetResultCellChange,
  keys: string[],
  tableId: string,
  entity: Entity,
) => {
  let type = "change" as UpdateType;
  // Add the type information to the keys
  keys = keys
    .map((key) => (encodedDataKeys.includes(key) ? key : [key, `type__${key}`]))
    .flat()
    // Add any internal keys (utilities)
    .concat(internalKeys);

  // Get the old and new rows
  let { current: newRow, prev: previousRow } = keys.reduce(
    (acc, key) => {
      const [_, oldValueAtKey, newValueAtKey] = getCellChange(tableId, entity, key);
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

  // Parse the values
  const newValue =
    type === "exit" ? undefined : (TinyBaseAdapter.parse(newRow as TinyBaseFormattedType) as ComponentValue<S, T>);
  const oldValue =
    type === "enter"
      ? undefined
      : (TinyBaseAdapter.parse(previousRow as TinyBaseFormattedType) as ComponentValue<S, T>);

  return { tableId, entity, value: { current: newValue, prev: oldValue }, type };
};
