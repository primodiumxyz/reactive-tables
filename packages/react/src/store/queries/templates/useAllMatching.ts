import { Entity, Schema } from "@latticexyz/recs";
import { Store } from "tinybase/store";

import { useEffect, useMemo, useRef, useState } from "react";

import { queryAllMatching, QueryAllMatchingOptions } from "@/store/queries/templates/queryAllMatching";
import {
  getValueAndTypeFromRowChange,
  TableQueryCallbacks,
  TableQueryUpdate,
  UpdateType,
} from "@/store/queries/createQuery";
import { Table } from "@/store/component/types";

// Listen to all entities matching multiple conditions across tables
// TODO: this will clearly need to be optimized; there are probably a few options:
// - setup a table listener by default on each component, then when setting up a query listener let that component know so it adds this callback to its array
// - keep a single useAllMatching listening to all tables, then on change see across all actual useQuery hooks which ones need to be triggered
// This won't be trigerred on creation for all initial matching entities, but only on change after the hook is mounted
export const useAllMatching = <table extends Table, S extends Schema, T = unknown>(
  store: Store,
  options: QueryAllMatchingOptions<table, S, T>,
  { onChange, onEnter, onExit }: TableQueryCallbacks<S, T>,
): Entity[] => {
  const [entities, setEntities] = useState<Entity[]>([]);
  // Create a ref for previous entities (to provide the update type in the callback)
  const prevEntities = useRef<Entity[]>([]);

  // Gather ids and schemas of all table we need to listen to
  // tableId => schema keys
  const tables = useMemo(() => {
    const { inside, notInside, with: withValues, without: withoutValues } = options;
    const tables: Record<string, string[]> = {};

    (inside ?? []).concat(notInside ?? []).forEach((component) => {
      tables[component.id] = Object.keys(component.schema);
    });
    (withValues ?? []).concat(withoutValues ?? []).forEach(({ component }) => {
      tables[component.id] = Object.keys(component.schema);
    });

    return tables;
  }, [options]);

  useEffect(() => {
    // Initial query
    const currEntities = queryAllMatching(store, options);
    setEntities(currEntities);
    prevEntities.current = currEntities;

    // Listen to all tables (at each row)
    const listenerId = store.addRowListener(null, null, (_, tableId, entityKey, getCellChange) => {
      if (!getCellChange) return;
      const entity = entityKey as Entity;

      // Refetch matching entities if one of the tables included in the query changes
      if (Object.keys(tables).includes(tableId)) {
        const newEntities = queryAllMatching(store, options);

        // Figure out if it's an enter or an exit
        let type = "change" as UpdateType;
        const inPrev = prevEntities.current.includes(entity);
        const inCurrent = newEntities.includes(entity);

        // Gather the previous and current values
        const args = getValueAndTypeFromRowChange(getCellChange, tables[tableId], tableId, entity) as TableQueryUpdate<
          S,
          T
        >;

        // Run the callbacks
        if (!inPrev && inCurrent) {
          type = "enter";
          onEnter?.({ ...args, type });
        } else if (inPrev && !inCurrent) {
          type = "exit";
          onExit?.({ ...args, type });
        }

        onChange?.({ ...args, type });

        // Update ref and state
        setEntities(newEntities);
        prevEntities.current = newEntities;
      }
    });

    return () => {
      store.delListener(listenerId);
    };
  }, [store /* tableIds */]); // TODO: tests get stuck with this, not sure why; but we shouldn't give some mutable options anyway afaik?

  return entities;
};
