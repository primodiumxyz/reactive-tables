import { Entity } from "@latticexyz/recs";

import { TinyBaseAdapter } from "@/adapter";
import { ValuesArray } from "@/adapter/formatValueForTinyBase";
import { QueryOptions, QueryResult } from "@/queries/templates/types";

// Query all entities for a given table that have a specific value (or partial value)
export const queryAllWithValue = ({ queries, tableId, value, formattedValue }: QueryOptions): QueryResult => {
  const queryId = "internal__queryAllWithValue";

  // Format the value for TinyBase storage to compare it with the stored values
  formattedValue = formattedValue ?? TinyBaseAdapter.format(Object.keys(value), Object.values(value) as ValuesArray);

  queries.setQueryDefinition(queryId, tableId, ({ select, where }) => {
    // Select the first cell as all entities with a value should have this cell
    select(Object.keys(value)[0]);

    // Keep entities which for each given key in the value
    Object.keys(value).forEach((key) => {
      // has an equal value in the table (where behaves like an AND operator for each key)
      where(key, formattedValue[key]);
    });
  });

  const entities: Entity[] = [];
  // Retrieve all ids of the rows matching the query (entities)
  queries.forEachResultRow(queryId, (rowId) => entities.push(rowId as Entity));

  return { id: queryId, entities };
};
