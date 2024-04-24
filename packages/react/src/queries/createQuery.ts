import { Entity, Schema } from "@latticexyz/recs";
import { GetResultCellChange, Queries } from "tinybase/queries";

import { TinyBaseAdapter, TinyBaseFormattedType } from "@/adapter";
import { encodedDataKeys, internalKeys } from "@/lib";
import { ComponentValue } from "@/components/types";

/* ---------------------------------- TYPES --------------------------------- */
type ResultRow = { [key: string]: TinyBaseFormattedType[typeof key] | undefined };

export type UpdateType = "enter" | "exit" | "change";
export type TableQueryUpdate<S extends Schema = Schema, T = unknown> = {
  tableId: string | undefined; // undefined if run on init on global query
  entity: Entity;
  value: { current: ComponentValue<S, T> | undefined; prev: ComponentValue<S, T> | undefined };
  type: UpdateType;
};

// At least one callback has to be provided
// We can't successfully typecheck complex union types with at least one required key
export type TableQueryCallbacks<S extends Schema, T = unknown> = Partial<{
  onChange: (update: TableQueryUpdate<S, T>) => void;
  onEnter: (update: TableQueryUpdate<S, T>) => void;
  onExit: (update: TableQueryUpdate<S, T>) => void;
  onUpdate: (update: TableQueryUpdate<S, T>) => void;
}>;

export type CreateQueryOptions<S extends Schema, T = unknown> = {
  queries: Queries;
  queryId: string;
  tableId: string;
  schema: S;
  options?: { runOnInit?: boolean };
  // Opt in to any callback
} & TableQueryCallbacks<S, T>;

export type CreateQueryResult = {
  unsubscribe: () => void;
};

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
  onUpdate,
  options = { runOnInit: true },
}: CreateQueryOptions<S, T>) => {
  if (!onChange && !onEnter && !onExit && !onUpdate) {
    throw new Error("At least one callback has to be provided");
  }

  const store = queries.getStore();
  // Get the keys to be able to aggregate the full value from each cell
  const keys = Object.keys(schema);

  // Remember the previous entities matching the query to figure out if it's an enter or an exit
  // This is a trick we need because we can't listen to entire row changes within the query when only some cells have changed
  let previousEntities: Entity[] = [];

  // Init listener
  // Unfortunatly `addResultRowListener()` won't work here as it's not triggered for cell changes
  // So we need to use a regular listener associated with the query instead
  const listenerId = store.addRowListener(tableId, null, (_, __, entityKey, getCellChange) => {
    if (!getCellChange) return;
    const entity = entityKey as Entity;

    // Get the entities matching the query
    const matchingEntities = queries.getResultRowIds(queryId);

    // Figure out if it's an enter or an exit
    let type = "change" as UpdateType;
    const inPrev = previousEntities.includes(entity);
    const inCurrent = matchingEntities.includes(entity);

    if (!inPrev && !inCurrent) return; // not in the query, we're not interested

    // Gather the previous and current values
    const args = getValueAndTypeFromRowChange(getCellChange, keys, tableId, entity) as TableQueryUpdate<S, T>;

    // Run the callbacks
    if (!inPrev && inCurrent) {
      type = "enter";
      onEnter?.({ ...args, type });

      previousEntities.push(entity);
    } else if (inPrev && !inCurrent) {
      type = "exit";
      onExit?.({ ...args, type });

      previousEntities = previousEntities.filter((e) => e !== entity);
    } else {
      onUpdate?.({ ...args, type });
    }

    onChange?.({ ...args, type });
  });

  if (options.runOnInit) {
    const rows = store.getTable(tableId);

    // Run callbacks for all entities in the query
    queries.forEachResultRow(queryId, (entity) => {
      const value = TinyBaseAdapter.parse(rows[entity]) as ComponentValue<S, T>;

      const args = {
        tableId,
        entity: entity as Entity,
        value: { current: value, prev: undefined },
        type: "enter" as UpdateType,
      };
      onEnter?.(args);
      onChange?.(args);

      previousEntities.push(entity as Entity);
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
  const { current: newRow, prev: previousRow } = keys.reduce(
    (acc, key) => {
      const [, oldValueAtKey, newValueAtKey] = getCellChange(tableId, entity, key);
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
