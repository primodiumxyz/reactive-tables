import { useEffect, useMemo, useState } from "react";

import { TinyBaseAdapter } from "@/adapter";
import { queryAllWithoutProps } from "@/queries/templates/queryAllWithoutProps";
import { TableQueryOptions } from "@/queries/types";
import { ContractTableDef, $Record, TinyBaseQueries } from "@/lib";

// Listen to all records inside a given table that DON'T have specific properties (or a single property)
export const useAllWithoutProps = <tableDef extends ContractTableDef>(
  queries: TinyBaseQueries,
  tableId: string,
  properties: TableQueryOptions<tableDef>["properties"],
): $Record[] => {
  // Format the properties for TinyBase storage to compare it with the stored properties
  const formattedProps = useMemo(
    () => TinyBaseAdapter.format(Object.keys(properties), Object.values(properties)),
    [properties],
  );
  const [$records, set$Records] = useState<$Record[]>([]);

  useEffect(() => {
    // Get the id and perform the initial query
    const { id, $records } = queryAllWithoutProps({ queries, tableId, properties, formattedProps });
    set$Records($records);

    // Setup the listener for the query
    const listenerId = queries.addResultRowIdsListener(id, () => {
      // Update with the records that match the query
      set$Records(queries.getResultRowIds(id) as $Record[]);
    });

    return () => {
      queries.delListener(listenerId);
    };
  }, [queries, formattedProps]);

  return $records;
};
