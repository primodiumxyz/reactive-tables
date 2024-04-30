import { query } from "@/queries";
import type { QueryOptions, TableWatcherCallbacks, TableUpdate, UpdateType } from "@/queries";
import { getPropertiesAndTypeFromRowChange } from "@/lib";
import type { ContractTableDef, $Record, Schema, Store } from "@/lib";

/**
 * Listen to all records matching multiple conditions across tables.
 *
 * This will trigger the provided callbacks whenever a record enters or exits the query conditions, or when its properties change
 * within the query conditions.
 *
 * Note: This is related to ${@link query} (direct retrieval based on conditions) and ${@link useQuery} (React hook inside callbacks + real-time retrieval).
 *
 * Note: See {@link QueryOptions} for more details on conditions criteria.
 *
 * @param store The TinyBase store containing the properties associated inside contract tables.
 * @param queryOptions The {@link QueryOptions} object containing the conditions to match.
 * @param callbacks The {@link TableWatcherCallbacks} to trigger on changes. Including: onChange, onEnter, onExit, onUpdate.
 * These will trigger a {@link TableUpdate} object inside the id of the updated table, the record, the previous and new properties of the record and the type of update.
 * @param options (optional) Additional options for the query. Currently only supports `runOnInit` to trigger the callbacks for all matching records on initialization.
 * @returns An object inside an `unsubscribe` method to stop listening to the query.
 * @example
 * This example creates a query that listens to all records that represent online players notInside a score of 0.
 *
 * ```ts
 * const { registry, store } = createWrapper({ mudConfig });
 * const {
 *   recordA, // online, score 10
 *   recordB, // online, score 0
 *   recordC, // offline, score 10
 * } = getRecords(); // for the sake of the example
 *
 * const query = $query(store, {
 *   withProperties: [ { table: registry.Player, properties: { online: true } } ],
 *   withoutProperties: [ { table: registry.Score, properties: { score: 0 } } ],
 * }, {
 *  onEnter: (update) => console.log(update),
 *  onExit: (update) => console.log(update),
 * }, { runOnInit: true }); // this is the default behavior
 * // -> { table: undefined, $record: recordA, current: undefined, prev: undefined, type: "enter" }
 *
 * registry.Score.update({ score: 15 }, recordA);
 * // -> { table: registry.Score, $record: recordA, current: { score: 15 }, prev: { score: 10 }, type: "change" }
 *
 * registry.Player.update({ online: false }, recordA);
 * // -> { table: registry.Player, $record: recordA, current: { online: false }, prev: { online: true }, type: "exit" }
 * ```
 * @category Queries
 */
export const $query = <tableDefs extends ContractTableDef[], S extends Schema, T = unknown>(
  _store: Store,
  queryOptions: QueryOptions<tableDefs, T>,
  callbacks: TableWatcherCallbacks<S, T>,
  options: { runOnInit?: boolean } = { runOnInit: true },
) => {
  const { onChange, onEnter, onExit, onUpdate } = callbacks;
  if (!onChange && !onEnter && !onExit && !onUpdate) {
    throw new Error("At least one callback has to be provided");
  }

  const store = _store();
  // Remember previous records (to provide the update type in the callback)
  let prev$Records: $Record[] = [];

  // Gather ids and schemas of all table we need to listen to
  // tableId => schema keys
  const tables: Record<string, string[]> = {};
  const { with: inside, without: notInside, withProperties, withoutProperties } = queryOptions;

  (inside ?? []).concat(notInside ?? []).forEach((table) => {
    tables[table.id] = Object.keys(table.schema);
  });
  (withProperties ?? []).concat(withoutProperties ?? []).forEach(({ table }) => {
    tables[table.id] = Object.keys(table.schema);
  });

  // Listen to all tables (at each row)
  const listenerId = store.addRowListener(null, null, (_, tableId, rowId, getCellChange) => {
    if (!getCellChange) return;
    const $record = rowId as $Record;

    // Refetch matching records if one of the tables included in the query changes
    if (Object.keys(tables).includes(tableId)) {
      const matching$Records = query(_store, queryOptions);

      // Figure out if it's an enter or an exit
      let type = "change" as UpdateType;
      const inPrev = prev$Records.includes($record);
      const inCurrent = matching$Records.includes($record);

      if (!inPrev && !inCurrent) return; // not in the query, we're not interested

      // Gather the previous and current properties
      const args = getPropertiesAndTypeFromRowChange(getCellChange, tables[tableId], tableId, $record) as TableUpdate<
        S,
        T
      >;

      // Run the callbacks
      if (!inPrev && inCurrent) {
        type = "enter";
        onEnter?.({ ...args, type });

        prev$Records.push($record);
      } else if (inPrev && !inCurrent) {
        type = "exit";
        onExit?.({ ...args, type });

        prev$Records = prev$Records.filter((e) => e !== $record);
      } else {
        onUpdate?.({ ...args, type });
      }

      onChange?.({ ...args, type });
    }
  });

  if (options.runOnInit) {
    const matching$Records = query(_store, queryOptions);

    // Run callbacks for all records in the query
    matching$Records.forEach(($record) => {
      const args = {
        tableId: undefined,
        $record,
        properties: { current: undefined, prev: undefined },
        type: "enter" as UpdateType,
      };
      onEnter?.(args);
      onChange?.(args);

      prev$Records.push($record);
    });
  }

  return {
    unsubscribe: () => store.delListener(listenerId),
  };
};
