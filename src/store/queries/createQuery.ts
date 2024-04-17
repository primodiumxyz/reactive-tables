import { Entity, Schema } from "@latticexyz/recs";
import { Queries } from "tinybase/queries";

import { TinyBaseAdapter } from "@/adapter";
import { ComponentValue } from "@/store/component/types";

/* ---------------------------------- TYPES --------------------------------- */
type UpdateType = "enter" | "exit" | "change";
export type TableQueryUpdate<S extends Schema, T = unknown> = {
  tableId: string;
  entity: Entity;
  value: { current: ComponentValue<S, T> | undefined; prev: ComponentValue<S, T> | undefined };
  type: UpdateType;
};

type CreateQueryOptions<S extends Schema, T = unknown> = {
  queries: Queries;
  queryId: string;
  tableId: string;
  // Opt in to any callback
  onChange?: (update: TableQueryUpdate<S, T>) => void;
  onEnter?: (update: TableQueryUpdate<S, T>) => void;
  onExit?: (update: TableQueryUpdate<S, T>) => void;
  options?: { runOnInit?: boolean };
};

/* ---------------------------------- QUERY --------------------------------- */
export const createQuery = <S extends Schema, T = unknown>({
  queries,
  queryId,
  tableId,
  onChange,
  onEnter,
  onExit,
  options = { runOnInit: true },
}: CreateQueryOptions<S, T>) => {
  const store = queries.getStore();

  // Init listener
  const listenerId = queries.addResultCellListener(
    queryId,
    null,
    null,
    (_, tableId, entity: Entity, key, newValueAtKey, oldValueAtKey) => {
      // Get the new row & value
      const newRow = store.getRow(tableId, entity);
      const newValue = TinyBaseAdapter.parse(newRow) as ComponentValue<S, T>;

      // If the entity just entered the query
      if (oldValueAtKey === undefined) {
        const args = { tableId, entity, value: { current: newValue, prev: undefined }, type: "enter" as UpdateType };

        onEnter?.(args);
        onChange?.(args);
        // If the entity just exited the query
      } else if (newValueAtKey === undefined) {
        const oldValue = TinyBaseAdapter.parse({ ...newRow, [key]: oldValueAtKey }) as ComponentValue<S, T>;

        const args = { tableId, entity, value: { current: newValue, prev: oldValue }, type: "exit" as UpdateType };
        onExit?.(args);
        onChange?.(args);
        // If it was a change
      } else {
        const oldValue = TinyBaseAdapter.parse({ ...newRow, [key]: oldValueAtKey }) as ComponentValue<S, T>;

        const args = { tableId, entity, value: { current: newValue, prev: oldValue }, type: "change" as UpdateType };
        onChange?.(args);
      }
    },
  );

  if (options.runOnInit) {
    const rows = store.getTable(tableId);

    // Run callbacks for all entities in the query
    Object.entries(rows).forEach(([entity, rawValue]) => {
      const value = TinyBaseAdapter.parse(rawValue) as ComponentValue<S, T>;

      const args = { tableId, entity, value: { current: value, prev: undefined }, type: "enter" as UpdateType };
      onEnter?.(args);
      onChange?.(args);
    });
  }

  return {
    unsubscribe: () => queries.delListener(listenerId),
  };
};
