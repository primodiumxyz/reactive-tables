import { type Primitive, TinyBaseAdapter } from "@/adapter";
import type { TableQueryOptions, TableQueryResult } from "@/queries/types";
import type { ContractTableDef, $Record } from "@/lib";

// Query all records for a given table that DON'T have specific properties (or partial properties)
export const queryAllWithoutProperties = <tableDef extends ContractTableDef>({
  queries,
  tableId,
  properties,
  formattedProperties,
}: TableQueryOptions<tableDef>): TableQueryResult => {
  const queryId = "internal__queryAllWithoutProperties";

  // Format the properties for TinyBase storage to compare it with the stored ones
  formattedProperties = formattedProperties ?? TinyBaseAdapter.encode(properties as Record<string, Primitive>);

  queries.setQueryDefinition(queryId, tableId, ({ select, where }) => {
    // We need to make one select for the row to be included
    // It should in any case contain any of the keys if the record is in the table
    // So we select the first key (all records)
    select(Object.keys(properties)[0]);

    // Where at least one of the properties is different
    where((getCell) => Object.keys(properties).some((key) => getCell(key) !== formattedProperties[key]));
  });

  const $records: $Record[] = [];
  // Retrieve all ids of the rows matching the query (records)
  queries.forEachResultRow(queryId, (rowId) => $records.push(rowId as $Record));
  // queries.delQueryDefinition("queryAllWithoutProperties");

  return { id: queryId, $records };
};
