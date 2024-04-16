import { Entity, Schema } from "@latticexyz/recs";
import { useEffect, useMemo, useState } from "react";
import { Queries } from "tinybase/queries";

import { queryAllWithValue, queryAllWithoutValue } from "./run";
import { TinyBaseAdapter } from "@/adapter";
import { ComponentValue } from "@/store/component/types";

// Use query on mount to quickly select relevant entities
// Then listen to store directly for row changes => determine if an entity should be added/removed (or nothing)
// Because with a query listener we might miss some changes (e.g. if an entity that was not included should now be)

// Listen to all entities inside a given table that have a specific value (or partial value)
export const useAllWithValue = <S extends Schema>(
  queries: Queries,
  tableId: string,
  value: Partial<ComponentValue<S>>,
): Entity[] => {
  // Format the value for TinyBase storage to compare it with the stored values
  const formattedValue = useMemo(() => TinyBaseAdapter.format(Object.keys(value), Object.values(value)), [value]);

  // Init with the entities that match the query
  const [entities, setEntities] = useState<Entity[]>(queryAllWithValue(queries, tableId, value, formattedValue));

  useEffect(() => {
    // Listen for changes in the store for that table
    const subId = queries.getStore().addCellListener(tableId, null, null, (store, _, entity) => {
      // Get the value for the entity that was updated
      const entityValue = store.getRow(tableId, entity);

      // Check if the value matches the query
      const matches = Object.keys(value).every((key) => entityValue[key] === formattedValue[key]);
      // Add or remove the entity depending on the result
      if (matches) {
        setEntities((prev) => [...new Set([...prev, entity])]);
      } else {
        setEntities((prev) => prev.filter((e) => e !== entity));
      }
    });

    return () => {
      queries.delListener(subId);
    };
  }, [queries, formattedValue]);

  return entities;
};

// Listen to all entities inside a given table that DON'T have a specific value (or partial value)
export const useAllWithoutValue = <S extends Schema>(
  queries: Queries,
  tableId: string,
  value: Partial<ComponentValue<S>>,
): Entity[] => {
  // Format the value for TinyBase storage to compare it with the stored values
  const formattedValue = useMemo(() => TinyBaseAdapter.format(Object.keys(value), Object.values(value)), [value]);

  // Init with the entities that match the query
  const [entities, setEntities] = useState<Entity[]>(queryAllWithoutValue(queries, tableId, value, formattedValue));

  useEffect(() => {
    // Listen for changes in the store for that table
    const subId = queries.getStore().addCellListener(tableId, null, null, (store, _, entity) => {
      // Get the value for the entity that was updated
      const entityValue = store.getRow(tableId, entity);

      // Check if the value matches the query (at least one key is different)
      const matches = Object.keys(value).some((key) => entityValue[key] !== formattedValue[key]);
      // Add or remove the entity depending on the result
      if (matches) {
        setEntities((prev) => [...new Set([...prev, entity])]);
      } else {
        setEntities((prev) => prev.filter((e) => e !== entity));
      }
    });

    return () => {
      queries.delListener(subId);
    };
  }, [queries, formattedValue]);

  return entities;
};
