import { Entity } from "@latticexyz/recs";

import { TinyBaseAdapter } from "@/adapter";
import { ValuesArray } from "@/adapter/formatValueForTinyBase";
import { QueryOptions, QueryResult } from "@/queries/templates/types";

// Query all entities for a given table that DON'T have a specific value (or partial value)
export const queryAllWithoutValue = ({ queries, tableId, value, formattedValue }: QueryOptions): QueryResult => {
  const queryId = "internal__queryAllWithoutValue";

  // Format the value for TinyBase storage to compare it with the stored values
  formattedValue = formattedValue ?? TinyBaseAdapter.format(Object.keys(value), Object.values(value) as ValuesArray);

  queries.setQueryDefinition(queryId, tableId, ({ select, where }) => {
    // We need to make one select for the row to be included
    // It should in any case contain any of the keys if the entity is in the table
    // So we select the first key (all entities)
    select(Object.keys(value)[0]);

    // Where at least one of the values is different
    where((getCell) => Object.keys(value).some((key) => getCell(key) !== formattedValue[key]));
  });

  const entities: Entity[] = [];
  // Retrieve all ids of the rows matching the query (entities)
  queries.forEachResultRow(queryId, (rowId) => entities.push(rowId as Entity));
  // queries.delQueryDefinition("queryAllWithoutValue");

  return { id: queryId, entities };
};
