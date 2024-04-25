import { createQueries } from "tinybase/queries";

import { queryAllWithProps } from "@/queries/templates/queryAllWithProps";
import { Properties } from "@/tables/types";
import { AbiToSchemaPlusMetadata, ContractTable } from "@/tables/contract/types";
import { ContractTableDef, $Record, TinyBaseStore } from "@/lib";

type QueryMatchingProperties<tableDef extends ContractTableDef, T = unknown> = {
  table: ContractTable<tableDef>;
  properties: Properties<AbiToSchemaPlusMetadata<tableDef["valueSchema"]>, T>;
};
// Query all records matching all of the given conditions:
// At least an inside or with condition needs to be provided for intial filtering
// TODO: fix type inference on heterogeneous array (with single ContractTableDef it wants the same table as the first one for all items)
export type QueryAllMatchingOptions<tableDefs extends ContractTableDef[], T = unknown> = {
  inside?: ContractTable<tableDefs[number]>[]; // inside these tables
  with?: QueryMatchingProperties<tableDefs[number], T>[]; // with the specified propertiess for their associated tables
  notInside?: ContractTable<tableDefs[number]>[]; // not inside these tables
  without?: QueryMatchingProperties<tableDefs[number], T>[]; // without the specified propertiess for their associated tables
};

// Query all records matching multiple conditions across tables
// TODO: this surely can be optimized, but right now we need something that works at least
// Needs to be benchmarked to see from which point it makes sense getting entire tables once and filtering them in memory
export const queryAllMatching = <tableDefs extends ContractTableDef[], T = unknown>(
  store: TinyBaseStore,
  options: QueryAllMatchingOptions<tableDefs, T>,
): $Record[] => {
  const { inside, notInside, with: withProps, without: withoutProps } = options;
  if (!inside && !withProps) {
    throw new Error("At least one inside or with condition needs to be provided");
  }

  const queries = createQueries(store);

  /* --------------------------------- INSIDE --------------------------------- */
  // Start with records inside all inside tables
  let $records = inside
    ? inside.reduce<$Record[]>((acc, table) => {
        return (
          table
            // get all records inside this table
            .getAll()
            // keep them if they were inside previous tables as well
            .filter(($record) => (acc.length > 0 ? acc.includes($record) : true))
        );
      }, [])
    : [];

  /* ---------------------------------- WITH ---------------------------------- */
  // Keep records with all given properties (or init if no previous condition was given)
  withProps?.forEach(({ table, properties }, i) => {
    const { id: queryId, $records: $recordsWithProps } = queryAllWithProps({
      queries,
      tableId: table.id,
      properties,
    });
    // If no previous condition was given, init with the first table's records
    if (inside === undefined && i === 0) {
      $records = $recordsWithProps;
      if (i === withProps.length - 1) queries.delQueryDefinition(queryId);
      return;
    }
    // If inside was given (or already iterated once), find out if among records with the given properties there are
    // $records that are already matching previous conditions
    $records = $recordsWithProps.filter(($record) => $records.includes($record));

    // Remove query definition on the last iteration
    if (i === withProps.length - 1) queries.delQueryDefinition(queryId);
  });

  /* ------------------------------- NOT INSIDE ------------------------------- */
  // Remove $records not inside any notInside table
  notInside?.forEach((table) => {
    // TODO: what is quicker: getAll() in table then filter out, or table.has() (underlying store.hasRow())
    $records = $records.filter(($record) => !table.has($record));
  });

  /* -------------------------------- WITHOUT --------------------------------- */
  // Remove records with any of the given propertiess
  withoutProps?.forEach(({ table, properties }, i) => {
    // we could use queryAllWithoutPropss but it seems more likely that this below will return less records to iterate over
    const { id: queryId, $records: $recordsWithProps } = queryAllWithProps({
      queries,
      tableId: table.id,
      properties,
    });
    $records = $records.filter(($record) => !$recordsWithProps.includes($record));

    if (i === withoutProps.length - 1) queries.delQueryDefinition(queryId);
  });

  return $records;
};
