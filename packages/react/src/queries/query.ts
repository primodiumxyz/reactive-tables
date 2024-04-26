import { createQueries } from "tinybase/queries";

import { queryAllWithProps } from "@/queries/templates/queryAllWithProps";
import { QueryOptions } from "@/queries/types";
import { ContractTableDef, $Record, TinyBaseStore } from "@/lib";

/**
 * Queries all records matching multiple provided conditions across tables.
 *
 * Note: See {@link QueryOptions} for more details on conditions criteria.
 *
 * @param store The TinyBase store containing the properties associated with contract tables.
 * @param options The {@link QueryOptions} object containing the conditions to match.
 * @returns An array of {@link $Record} objects matching all conditions.
 * @example
 * This example queries all records that have a score of 10 in the "Score" table and are not inside the "GameOver" table.
 *
 * ```ts
 * const { registry, store } = createWrapper({ mudConfig });
 * const {
 *   recordA, // inside Score with score 10
 *   recordB, // inside Score with score 10 and inside GameOver
 *   recordC, // inside Score with score 3
 * } = getRecords(); // for the sake of the example
 *
 * const records = query(store, {
 *   with: [ { table: registry.Score, properties: { score: 10 } } ],
 *   notInside: [ registry.GameOver ],
 * });
 * console.log(records);
 * // -> [ recordA ]
 * ```
 * @category Queries
 */
export const query = <tableDefs extends ContractTableDef[], T = unknown>(
  store: TinyBaseStore,
  options: QueryOptions<tableDefs, T>,
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
