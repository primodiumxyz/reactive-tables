import { TinyBaseAdapter, PropertiesArray } from "@/adapter";
import { QueryTableOptions, QueryTableResult } from "@/queries";
import { ContractTableDef, $Record } from "@/lib";

// Query all records for a given table that have specific properties (or partial properties)
export const queryAllWithProps = <tableDef extends ContractTableDef>({
  queries,
  tableId,
  properties,
  formattedProps,
}: QueryTableOptions<tableDef>): QueryTableResult => {
  const queryId = "internal__queryAllWithProps";

  // Format the properties for TinyBase storage to compare it with the stored properties
  formattedProps =
    formattedProps ?? TinyBaseAdapter.format(Object.keys(properties), Object.values(properties) as PropertiesArray);

  queries.setQueryDefinition(queryId, tableId, ({ select, where }) => {
    // Select the first cell as all records with a properties should have this cell
    select(Object.keys(properties)[0]);

    // Keep records which for each given key in the properties
    Object.keys(properties).forEach((key) => {
      // has an equal property in the table (where behaves like an AND operator for each key)
      where(key, formattedProps[key]);
    });
  });

  const $records: $Record[] = [];
  // Retrieve all ids of the rows matching the query (records)
  queries.forEachResultRow(queryId, (rowId) => $records.push(rowId as $Record));

  return { id: queryId, $records };
};
