import { Entity, Schema } from "@latticexyz/recs";

import { queryAllMatching, QueryAllMatchingOptions } from "@/queries/templates/queryAllMatching";
import { getValueAndTypeFromRowChange, TableQueryCallbacks, TableQueryUpdate, UpdateType } from "@/queries/createQuery";
import { MUDTable, TinyBaseStore } from "@/lib";

// Listen to all entities matching multiple conditions across tables
// Alternative to `query` (fetch once) and `useQuery` (hook)
export const createGlobalQuery = <tables extends MUDTable[], S extends Schema, T = unknown>(
  store: TinyBaseStore,
  queryOptions: QueryAllMatchingOptions<tables, T>,
  { onChange, onEnter, onExit, onUpdate }: TableQueryCallbacks<S, T>,
  options: { runOnInit?: boolean } = { runOnInit: true },
) => {
  if (!onChange && !onEnter && !onExit && !onUpdate) {
    throw new Error("At least one callback has to be provided");
  }

  // Remember previous entities (to provide the update type in the callback)
  let prevEntities: Entity[] = [];

  // Gather ids and schemas of all table we need to listen to
  // tableId => schema keys
  const tables: Record<string, string[]> = {};
  const { inside, notInside, with: withValues, without: withoutValues } = queryOptions;

  (inside ?? []).concat(notInside ?? []).forEach((component) => {
    tables[component.id] = Object.keys(component.schema);
  });
  (withValues ?? []).concat(withoutValues ?? []).forEach(({ component }) => {
    tables[component.id] = Object.keys(component.schema);
  });

  // Listen to all tables (at each row)
  const listenerId = store.addRowListener(null, null, (_, tableId, entityKey, getCellChange) => {
    if (!getCellChange) return;
    const entity = entityKey as Entity;

    // Refetch matching entities if one of the tables included in the query changes
    if (Object.keys(tables).includes(tableId)) {
      const matchingEntities = queryAllMatching(store, queryOptions);

      // Figure out if it's an enter or an exit
      let type = "change" as UpdateType;
      const inPrev = prevEntities.includes(entity);
      const inCurrent = matchingEntities.includes(entity);

      if (!inPrev && !inCurrent) return; // not in the query, we're not interested

      // Gather the previous and current values
      const args = getValueAndTypeFromRowChange(getCellChange, tables[tableId], tableId, entity) as TableQueryUpdate<
        S,
        T
      >;

      // Run the callbacks
      if (!inPrev && inCurrent) {
        type = "enter";
        onEnter?.({ ...args, type });

        prevEntities.push(entity);
      } else if (inPrev && !inCurrent) {
        type = "exit";
        onExit?.({ ...args, type });

        prevEntities = prevEntities.filter((e) => e !== entity);
      } else {
        onUpdate?.({ ...args, type });
      }

      onChange?.({ ...args, type });
    }
  });

  if (options.runOnInit) {
    const matchingEntities = queryAllMatching(store, queryOptions);

    // Run callbacks for all entities in the query
    matchingEntities.forEach((entity) => {
      const args = {
        tableId: undefined,
        entity,
        value: { current: undefined, prev: undefined },
        type: "enter" as UpdateType,
      };
      onEnter?.(args);
      onChange?.(args);

      prevEntities.push(entity);
    });
  }

  return {
    unsubscribe: () => store.delListener(listenerId),
  };
};
