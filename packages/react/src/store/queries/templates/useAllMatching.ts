import { Entity, Schema } from "@latticexyz/recs";
import { Store } from "tinybase/store";

import { useEffect, useMemo, useState } from "react";

import { queryAllMatching, QueryAllMatchingOptions } from "@/store/queries/templates/queryAllMatching";
import { Table } from "@/store/component/types";

// Listen to all entities matching multiple conditions across tables
// TODO: this will clearly need to be optimized; there are probably a few options:
// - setup a table listener by default on each component, then when setting up a query listener let that component know so it adds this callback to its array
// - keep a single useAllMatching listening to all tables, then on change see across all actual useQuery hooks which ones need to be triggered
export const useAllMatching = <table extends Table, S extends Schema, T = unknown>(
  store: Store,
  options: QueryAllMatchingOptions<table, S, T>,
): Entity[] => {
  const [entities, setEntities] = useState<Entity[]>([]);
  // Gather ids of all table we need to listen to
  const tableIds = useMemo(() => {
    const { inside, notInside, with: withValues, without: withoutValues } = options;
    return Array.from(
      new Set([
        ...((inside ?? []).concat(notInside ?? []).map((component) => component.id) ?? []),
        ...(withValues ?? []).concat(withoutValues ?? []).map(({ component }) => component.id),
      ]),
    );
  }, [options]);

  useEffect(() => {
    // Initial query
    setEntities(queryAllMatching(store, options));

    // Listen to all tables
    const listenerId = store.addTableListener(null, (_, tableId) => {
      // Refetch matching entities if one of the tables included in the query changes
      if (tableIds.includes(tableId)) {
        setEntities(queryAllMatching(store, options));
      }
    });

    return () => {
      store.delListener(listenerId);
    };
  }, [store /* tableIds */]); // TODO: tests get stuck with this, not sure why; but we shouldn't give some mutable options anyway afaik?

  return entities;
};
