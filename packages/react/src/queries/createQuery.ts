import { GetResultCellChange } from "tinybase/queries";

import { TinyBaseAdapter, TinyBaseFormattedType } from "@/adapter";
import { encodedDataKeys, internalKeys, $Record, Schema, TinyBaseQueries } from "@/lib";
import { Properties } from "@/tables";

/* ---------------------------------- TYPES --------------------------------- */
type ResultRow = { [key: string]: TinyBaseFormattedType[typeof key] | undefined };

export type UpdateType = "enter" | "exit" | "change";
export type TableQueryUpdate<S extends Schema = Schema, T = unknown> = {
  tableId: string | undefined; // undefined if run on init on global query
  $record: $Record;
  properties: { current: Properties<S, T> | undefined; prev: Properties<S, T> | undefined };
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
  queries: TinyBaseQueries;
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
  // Get the keys to be able to aggregate the full properties from each cell
  const keys = Object.keys(schema);

  // Remember the previous records matching the query to figure out if it's an enter or an exit
  // This is a trick we need because we can't listen to entire row changes within the query when only some cells have changed
  let previous$Records: $Record[] = [];

  // Init listener
  // Unfortunatly `addResultRowListener()` won't work here as it's not triggered for cell changes
  // So we need to use a regular listener associated with the query instead
  const listenerId = store.addRowListener(tableId, null, (_, __, rowId, getCellChange) => {
    if (!getCellChange) return;
    const $record = rowId as $Record;

    // Get the records matching the query
    const matching$Records = queries.getResultRowIds(queryId);

    // Figure out if it's an enter or an exit
    let type = "change" as UpdateType;
    const inPrev = previous$Records.includes($record);
    const inCurrent = matching$Records.includes($record);

    if (!inPrev && !inCurrent) return; // not in the query, we're not interested

    // Gather the previous and current properties
    const args = getPropsAndTypeFromRowChange(getCellChange, keys, tableId, $record) as TableQueryUpdate<S, T>;

    // Run the callbacks
    if (!inPrev && inCurrent) {
      type = "enter";
      onEnter?.({ ...args, type });

      previous$Records.push($record);
    } else if (inPrev && !inCurrent) {
      type = "exit";
      onExit?.({ ...args, type });

      previous$Records = previous$Records.filter((e) => e !== $record);
    } else {
      onUpdate?.({ ...args, type });
    }

    onChange?.({ ...args, type });
  });

  if (options.runOnInit) {
    const rows = store.getTable(tableId);

    // Run callbacks for all records in the query
    queries.forEachResultRow(queryId, ($record) => {
      const currentProps = TinyBaseAdapter.parse(rows[$record]) as Properties<S, T>;

      const args = {
        tableId,
        $record: $record as $Record,
        properties: { current: currentProps, prev: undefined },
        type: "enter" as UpdateType,
      };
      onEnter?.(args);
      onChange?.(args);

      previous$Records.push($record as $Record);
    });
  }

  return {
    unsubscribe: () => queries.delListener(listenerId),
  };
};

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
    .map((key) => (encodedDataKeys.includes(key) ? key : [key, `type__${key}`]))
    .flat()
    // Add any internal keys (utilities)
    .concat(internalKeys);

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
    type === "exit" ? undefined : (TinyBaseAdapter.parse(newRow as TinyBaseFormattedType) as Properties<S, T>);
  const prevProps =
    type === "enter" ? undefined : (TinyBaseAdapter.parse(previousRow as TinyBaseFormattedType) as Properties<S, T>);

  return { tableId, $record, properties: { current: newProps, prev: prevProps }, type };
};
