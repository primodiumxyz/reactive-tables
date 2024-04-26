import { useEffect, useMemo, useRef, useState } from "react";

import { query, QueryOptions, TableWatcherCallbacks, TableUpdate, UpdateType } from "@/queries";
import { ContractTableDef, getPropsAndTypeFromRowChange, $Record, Schema, TinyBaseStore } from "@/lib";

// TODO: this will clearly need to be optimized; there are probably a few options:
// - setup a table listener by default on each table, then when setting up a query listener let that table know so it adds this callback to its array
// - keep a single useQuery listening to all tables, then on change see across all actual useQuery hooks which ones need to be triggered

/**
 * React hook to query all records matching multiple conditions across tables.
 *
 * This will return an array of $Record objects matching all conditions, and will trigger the provided callbacks on changes.
 *
 * Note: See {@link QueryOptions} for more details on conditions criteria.
 *
 * Note: This hook will only trigger on changes after it's mounted, not on creation for all initial matching records.
 *
 * @param store The TinyBase store containing the properties associated with contract tables.
 * @param options The {@link QueryOptions} object containing the conditions to match.
 * @param callbacks The {@link TableWatcherCallbacks} to trigger on changes. Including: onChange, onEnter, onExit, onUpdate.
 * These will trigger a {@link TableUpdate} object with the id of the updated table, the record, the previous and new properties of the record and the type of update.
 * @returns An array of {@link $Record} matching all conditions.
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
 * const records = useQuery(store, {
 *   with: [ { table: registry.Score, properties: { score: 10 } } ],
 *   notInside: [ registry.GameOver ],
 * }, {
 *   onChange: (update) => console.log(update),
 * });
 * console.log(records);
 * // -> [ recordA ]
 *
 * registry.Score.update({ score: 10 }, recordC);
 * // -> { table: registry.Score, $record: recordC, current: { score: 10 }, prev: { score: 3 }, type: "change" }
 * console.log(records);
 * // -> [ recordA, recordC ]
 * ```
 * @category Queries
 */
export const useQuery = <tableDefs extends ContractTableDef[], S extends Schema, T = unknown>(
  store: TinyBaseStore,
  options: QueryOptions<tableDefs, T>,
  callbacks: TableWatcherCallbacks<S, T>,
): $Record[] => {
  const { onChange, onEnter, onExit, onUpdate } = callbacks;
  const [$records, set$Records] = useState<$Record[]>([]);
  // Create a ref for previous records (to provide the update type in the callback)
  const prev$Records = useRef<$Record[]>([]);

  // Gather ids and schemas of all table we need to listen to
  // tableId => schema keys
  const tables = useMemo(() => {
    const { inside, notInside, with: withProps, without: withoutProps } = options;
    const tables: Record<string, string[]> = {};

    (inside ?? []).concat(notInside ?? []).forEach((table) => {
      tables[table.id] = Object.keys(table.schema);
    });
    (withProps ?? []).concat(withoutProps ?? []).forEach(({ table }) => {
      tables[table.id] = Object.keys(table.schema);
    });

    return tables;
  }, [options]);

  useEffect(() => {
    // Initial query
    const curr$Records = query(store, options);
    set$Records(curr$Records);
    prev$Records.current = curr$Records;

    // Listen to all tables (at each row)
    const listenerId = store.addRowListener(null, null, (_, tableId, $recordKey, getCellChange) => {
      if (!getCellChange) return;
      const $record = $recordKey as $Record;

      // Refetch matching $records if one of the tables included in the query changes
      if (Object.keys(tables).includes(tableId)) {
        const new$Records = query(store, options);

        // Figure out if it's an enter or an exit
        let type = "change" as UpdateType;
        const inPrev = prev$Records.current.includes($record);
        const inCurrent = new$Records.includes($record);

        // Gather the previous and current properties
        const args = getPropsAndTypeFromRowChange(getCellChange, tables[tableId], tableId, $record) as TableUpdate<
          S,
          T
        >;

        // Run the callbacks
        if (!inPrev && inCurrent) {
          type = "enter";
          onEnter?.({ ...args, type });
        } else if (inPrev && !inCurrent) {
          type = "exit";
          onExit?.({ ...args, type });
        } else {
          onUpdate?.({ ...args, type });
        }

        onChange?.({ ...args, type });

        // Update ref and state
        set$Records(new$Records);
        prev$Records.current = new$Records;
      }
    });

    return () => {
      store.delListener(listenerId);
    };
  }, [store /* tableIds */]); // TODO: tests get stuck with this, not sure why; but apart from Typescript possibly getting angry we shouldn't give any mutable options anyway?

  return $records;
};
