import { Group, Having, Join, Select, Where } from "tinybase/queries";

import { TinyBaseAdapter } from "@/adapter";
import {
  CreateQueryOptions,
  CreateQueryResult,
  TableQueryUpdate,
  UpdateType,
  createQuery,
  getPropsAndTypeFromRowChange,
} from "@/queries";
import { Properties } from "@/tables";
import { Schema, $Record, uuid } from "@/lib";

/* ---------------------------------- TYPES --------------------------------- */
export type CreateQueryWrapperOptions<S extends Schema, T = unknown> = Omit<CreateQueryOptions<S, T>, "queryId"> & {
  query?: (keywords: { select: Select; join: Join; where: Where; group: Group; having: Having }) => void;
};

/* ---------------------------------- QUERY --------------------------------- */
// Create a query for a table, and trigger callbacks on enter, exit, and/or change
// If the query is empty, it will just trigger callbacks on any change within the table
// Note: with this and with `createQuery`, we might have undefined properties when a recorded key completely exits the table, as
// then the row is deleted from the store, so we can't get either the new or the old properties.
export const createQueryWrapper = <S extends Schema, T = unknown>({
  queries,
  query, // leave empty to listen to the whole table
  tableId,
  schema,
  onChange,
  onEnter,
  onExit,
  onUpdate,
  options = { runOnInit: true },
}: CreateQueryWrapperOptions<S, T>): CreateQueryResult => {
  // If a query is provided, define it and create the listener
  if (query) {
    const queryId = uuid();
    queries.setQueryDefinition(queryId, tableId, query);
    return createQuery({ queries, queryId, tableId, schema, onChange, onEnter, onExit, options });
  }

  if (!onChange && !onEnter && !onExit && !onUpdate) {
    throw new Error("At least one callback has to be provided");
  }

  // If not, just listen to the whole table
  const store = queries.getStore();
  // Get the keys to be able to aggregate the full properties from each cell
  const keys = Object.keys(schema);

  // This will be triggered on any change to a row/cell (meaning all properties or just a single one)
  const listenerId = store.addRowListener(tableId, null, (_, __, rowId, getCellChange) => {
    // If `getCellChange` is undefined, it means that `store.callListener()` was called
    if (!getCellChange) return;
    const $record = rowId as $Record;

    // Gather the properties and type of the change
    const args = getPropsAndTypeFromRowChange(getCellChange, keys, tableId, $record) as TableQueryUpdate<S, T>;

    // Run the callbacks
    if (args.type === "enter") {
      onEnter?.(args);
    } else if (args.type === "exit") {
      onExit?.(args);
    } else {
      onUpdate?.(args);
    }

    onChange?.(args);
  });

  if (options.runOnInit) {
    const rows = store.getTable(tableId);

    // Run callbacks for all records in the query
    Object.entries(rows).forEach(([rowId, rowContent]) => {
      const currentProps = TinyBaseAdapter.parse(rowContent) as Properties<S, T>;

      const args = {
        tableId,
        $record: rowId as $Record,
        properties: { current: currentProps, prev: undefined },
        type: "enter" as UpdateType,
      };
      onEnter?.(args);
      onChange?.(args);
    });
  }

  return {
    unsubscribe: () => store.delListener(listenerId),
  };
};
