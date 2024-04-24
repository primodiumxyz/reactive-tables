import { Entity } from "@latticexyz/recs";
import { Queries } from "tinybase/queries";

import { useEffect, useMemo, useState } from "react";

import { TinyBaseAdapter } from "@/adapter";
import { queryAllWithValue } from "@/queries/templates/queryAllWithValue";
import { QueryOptions } from "@/queries/templates/types";
import { MUDTable } from "@/lib";

// Listen to all entities inside a given table that have a specific value (or partial value)
export const useAllWithValue = <table extends MUDTable>(
  queries: Queries,
  tableId: string,
  value: QueryOptions<table>["value"],
): Entity[] => {
  // Format the value for TinyBase storage to compare it with the stored values
  const formattedValue = useMemo(() => TinyBaseAdapter.format(Object.keys(value), Object.values(value)), [value]);
  const [entities, setEntities] = useState<Entity[]>([]);

  useEffect(() => {
    // Get the id and perform the initial query
    const { id, entities } = queryAllWithValue({ queries, tableId, value, formattedValue });
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
