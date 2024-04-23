import { Entity, Schema } from "@latticexyz/recs";
import { Queries } from "tinybase/queries";

import { useEffect, useMemo, useState } from "react";

import { TinyBaseAdapter } from "@/adapter";
import { queryAllWithoutValue } from "@/queries/templates/queryAllWithoutValue";
import { ComponentValue } from "@/components/contract/types";

// Listen to all entities inside a given table that DON'T have a specific value (or partial value)
export const useAllWithoutValue = <S extends Schema>(
  queries: Queries,
  tableId: string,
  value: Partial<ComponentValue<S>>,
): Entity[] => {
  // Format the value for TinyBase storage to compare it with the stored values
  const formattedValue = useMemo(() => TinyBaseAdapter.format(Object.keys(value), Object.values(value)), [value]);
  const [entities, setEntities] = useState<Entity[]>([]);

  useEffect(() => {
    // Get the id and perform the initial query
    const { id, entities } = queryAllWithoutValue({ queries, tableId, value, formattedValue });
    setEntities(entities);

    // Setup the listener for the query
    const listenerId = queries.addResultRowIdsListener(id, () => {
      // Update with the entities that match the query
      setEntities(queries.getResultRowIds(id) as Entity[]);
    });

    return () => {
      queries.delListener(listenerId);
    };
  }, [queries, formattedValue]);

  return entities;
};
