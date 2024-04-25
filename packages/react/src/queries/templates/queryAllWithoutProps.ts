import { PropertiesArray, TinyBaseAdapter } from "@/adapter";
import { QueryTableOptions, QueryTableResult } from "@/queries/templates/types";
import { ContractTableDef, $Record } from "@/lib";

// Query all records for a given table that DON'T have specific properties (or partial properties)
export const queryAllWithoutProps = <tableDef extends ContractTableDef>({
  queries,
  tableId,
  properties,
  formattedProps,
}: QueryTableOptions<tableDef>): QueryTableResult => {
  const queryId = "internal__queryAllWithoutProps";

  // Format the properties for TinyBase storage to compare it with the stored ones
  formattedProps =
    formattedProps ?? TinyBaseAdapter.format(Object.keys(properties), Object.values(properties) as PropertiesArray);

  queries.setQueryDefinition(queryId, tableId, ({ select, where }) => {
    // We need to make one select for the row to be included
    // It should in any case contain any of the keys if the record is in the table
    // So we select the first key (all records)
    select(Object.keys(properties)[0]);

    // Where at least one of the properties is different
    where((getCell) => Object.keys(properties).some((key) => getCell(key) !== formattedProps[key]));
  });

  const $records: $Record[] = [];
  // Retrieve all ids of the rows matching the query (records)
  queries.forEachResultRow(queryId, (rowId) => $records.push(rowId as $Record));
  // queries.delQueryDefinition("queryAllWithoutProps");

  return { id: queryId, $records };
};
