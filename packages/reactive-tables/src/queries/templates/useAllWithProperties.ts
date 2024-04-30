import { useEffect, useMemo, useState } from "react";

import { type Primitive, TinyBaseAdapter } from "@/adapter";
import { queryAllWithProperties } from "@/queries/templates/queryAllWithProperties";
import type { TableQueryOptions } from "@/queries";
import type { ContractTableDef, $Record, TinyBaseQueries } from "@/lib";

// Listen to all records inside a given table that have specific properties (or partial properties)
export const useAllWithProperties = <tableDef extends ContractTableDef>(
  queries: TinyBaseQueries,
  tableId: string,
  properties: TableQueryOptions<tableDef>["properties"],
): $Record[] => {
  // Format the properties for TinyBase storage to compare it with the stored ones
  const formattedProperties = useMemo(
    () => TinyBaseAdapter.encode(properties as Record<string, Primitive>),
    [properties],
  );
  const [$records, set$Records] = useState<$Record[]>([]);

  useEffect(() => {
    // Get the id and perform the initial query
    const { id, $records } = queryAllWithProperties({ queries, tableId, properties, formattedProperties });
    set$Records($records);

    // Setup the listener for the query
    const listenerId = queries.addResultRowIdsListener(id, () => {
      // Update with the records that match the query
      set$Records(queries.getResultRowIds(id) as $Record[]);
    });

    return () => {
      queries.delListener(listenerId);
    };
  }, [queries, formattedProperties]);

  return $records;
};
