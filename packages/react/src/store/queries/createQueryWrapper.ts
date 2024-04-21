import { Entity, Schema } from "@latticexyz/recs";
import { uuid } from "@latticexyz/utils";
import { Group, Having, Join, Select, Where } from "tinybase/queries";

import { TinyBaseAdapter } from "@/adapter";
import {
  CreateQueryOptions,
  CreateQueryResult,
  TableQueryUpdate,
  UpdateType,
  createQuery,
  getValueAndTypeFromRowChange,
} from "@/store/queries/createQuery";
import { ComponentValue } from "@/store/component/types";

/* ---------------------------------- TYPES --------------------------------- */
export type CreateQueryWrapperOptions<S extends Schema, T = unknown> = Omit<CreateQueryOptions<S, T>, "queryId"> & {
  query?: (keywords: { select: Select; join: Join; where: Where; group: Group; having: Having }) => void;
};

/* ---------------------------------- QUERY --------------------------------- */
// Create a query for a table (component), and trigger callbacks on enter, exit, and/or change
// If the query is empty, it will just trigger callbacks on any change within the table
// Note: with this and with `createQuery`, we might have undefined values when an entity completely exits the component, as
// then the row is deleted from the store, so we can't get either the new or the old value.
export const createQueryWrapper = <S extends Schema, T = unknown>({
  queries,
  query, // leave empty to listen to the whole table
  tableId,
  schema,
  onChange,
  onEnter,
  onExit,
  options = { runOnInit: true },
}: CreateQueryWrapperOptions<S, T>): CreateQueryResult => {
  // If a query is provided, define it and create the listener
  if (query) {
    const queryId = uuid();
    queries.setQueryDefinition(queryId, tableId, query);
    return createQuery({ queries, queryId, tableId, schema, onChange, onEnter, onExit, options });
  }

  // If not, just listen to the whole table
  const store = queries.getStore();
  // Get the keys to be able to aggregate the full value from each cell
  const keys = Object.keys(schema);

  // This will be triggered on any change to a row/cell (meaning a value or a single value key)
  const listenerId = store.addRowListener(tableId, null, (_, __, entity: Entity, getCellChange) => {
    // If `getCellChange` is undefined, it means that `store.callListener()` was called
    if (!getCellChange) return;

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
    Object.entries(rows).forEach(([entity, rawValue]) => {
      const value = TinyBaseAdapter.parse(rawValue) as ComponentValue<S, T>;

      const args = { entity, value: { current: value, prev: undefined }, type: "enter" as UpdateType };
      onEnter?.(args);
      onChange?.(args);
    });
  }

  return {
    unsubscribe: () => store.delListener(listenerId),
  };
};
