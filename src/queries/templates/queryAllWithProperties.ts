import { type Primitive, TinyBaseAdapter } from "@/adapter";
import type { TableQueryOptions, TableQueryResult } from "@/queries";
import type { ContractTableDef, $Record } from "@/lib";

// Query all records for a given table that have specific properties (or partial properties)
export const queryAllWithProperties = <tableDef extends ContractTableDef>({
  queries,
  tableId,
  properties,
  formattedProperties,
}: TableQueryOptions<tableDef>): TableQueryResult => {
  const queryId = "internal__queryAllWithProperties";

  // Format the properties for TinyBase storage to compare it with the stored properties
  formattedProperties = formattedProperties ?? TinyBaseAdapter.encode(properties as Record<string, Primitive>);

  queries.setQueryDefinition(queryId, tableId, ({ select, where }) => {
    // Select the first cell as all records with a properties should have this cell
    select(Object.keys(properties)[0]);

    // Keep records which for each given key in the properties
    Object.keys(properties).forEach((key) => {
      // has an equal property in the table (where behaves like an AND operator for each key)
      where(key, formattedProperties[key]);
    });
  });

  const $records: $Record[] = [];
  // Retrieve all ids of the rows matching the query (records)
  queries.forEachResultRow(queryId, (rowId) => $records.push(rowId as $Record));

  return { id: queryId, $records };
};
