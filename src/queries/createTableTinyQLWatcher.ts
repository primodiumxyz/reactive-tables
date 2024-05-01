import type { Properties } from "@/tables";
import { TinyBaseAdapter } from "@/adapter";
import type { CreateQueryWatcherOptions, TableUpdate, TableWatcherParams, UpdateType } from "@/queries";
import { getPropertiesAndTypeFromRowChange, type $Record, type Schema } from "@/lib";

// (jsdocs)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createTableWatcher } from "./createTableWatcher";

/**
 * Creates a watcher for a specific TinyQL query inside a table.
 * This will listen to changes in the query and trigger callbacks when records enter, exit, or change.
 *
 * Note: This function is directly provided as a table method, when using `table.watch()` and filling the `query` parameter.
 * Which abstracts a few parameters like `queries`, `queryId`, `tableId` and `schema` (the `queryId` is generated when defining the provided query).
 *
 * Note: Refer to {@link createTableWatcher} for the behavior when no query is provided.
 *
 * @param options The options for creating the query watcher.
 * - `queries` The TinyBase queries object tied to the store containing properties for all records inside this table (abstracted).
 * - `queryId` The id of the query to watch after it's been defined internally (abstracted).
 * - `tableId` The id of the table to watch for changes (abstracted).
 * - `schema` The schema of the properties for all records inside this table (abstracted).
 * - `onChange` Callback triggered on any change in the query (encompassing enter, exit, and update).
 * - `onEnter` Callback triggered when a record enters the query (`properties.prev` will be undefined).
 * - `onExit` Callback triggered when a record exits the query (`properties.current` will be undefined).
 * - `onUpdate` Callback triggered when the properties of a record are updated, but it stays within the query.
 * @param params Additional parameters for the watcher.
 * - `runOnInit` Whether to trigger the callbacks for all matching records on initialization (default: `true`).
 * @returns An object with an `unsubscribe` method to stop listening to the query.
 * @example
 * This example creates a watcher for all records with more than 10 points in the "Score" table.
 *
 * ```ts
 * const { registry, store } = createWrapper({ mudConfig });
 * registry.Score.set({ points: 10 }, recordA);
 *
 * // The function should be accessed from the table's methods
 * const { unsubscribe } = registry.Score.watch({
 *   onChange: (update) => console.log(update),
 *   // if `query` is not provided, it will watch for any change in the table
 *   query: ({ where }) => {
 *     where((getCell) => (getCell("points") as number) > 10);
 *   },
 * });
 * // -> { table: registry.Score, $record: recordA, current: { points: 10 }, prev: undefined, type: "enter" }
 *
 * registry.Score.update({ points: 15 }, recordA);
 * // -> { table: registry.Score, $record: recordA, current: { points: 15 }, prev: { points: 10 }, type: "change" }
 *
 * registry.Score.update({ points: 5 }, recordA);
 * // -> { table: registry.Score, $record: recordA, current: undefined, prev: { points: 15 }, type: "exit" }
 *
 * // Unsubscribe from the query once you're done or when disposing of the component
 * unsubscribe();
 * ```
 * @see TinyQL for writing a query: https://tinybase.org/guides/making-queries/tinyql/
 * @category Queries
 * @internal
 */
export const createTableTinyQLWatcher = <S extends Schema, T = unknown>(
  options: CreateQueryWatcherOptions<S, T>,
  params: TableWatcherParams = { runOnInit: true },
) => {
  const { queries, queryId, tableId, schema, onChange, onEnter, onExit, onUpdate } = options;
  if (!onChange && !onEnter && !onExit && !onUpdate) {
    throw new Error("At least one callback has to be provided");
  }

  const store = queries.getStore();
  // Get the keys to be able to aggregate the full properties from each cell
  const keys = Object.keys(schema);

  // Remember the previous records matching the query to figure out if it's an enter or an exit
  // This is a trick we need because we can't listen to entire row changes within the query when only some cells have changed
  let previous$Records: $Record[] = [];

  // Init listener
  // Unfortunatly `addResultRowListener()` won't work here as it's not triggered for cell changes
  // So we need to use a regular listener associated with the query instead
  const listenerId = store.addRowListener(tableId, null, (_, __, rowId, getCellChange) => {
    if (!getCellChange) return;
    const $record = rowId as $Record;

    // Get the records matching the query
    const matching$Records = queries.getResultRowIds(queryId);

    // Figure out if it's an enter or an exit
    let type = "change" as UpdateType;
    const inPrev = previous$Records.includes($record);
    const inCurrent = matching$Records.includes($record);

    if (!inPrev && !inCurrent) return; // not in the query, we're not interested

    // Gather the previous and current properties
    const args = getPropertiesAndTypeFromRowChange(getCellChange, keys, tableId, $record) as TableUpdate<S, T>;

    // Run the callbacks
    if (!inPrev && inCurrent) {
      type = "enter";
      onEnter?.({ ...args, type });

      previous$Records.push($record);
    } else if (inPrev && !inCurrent) {
      type = "exit";
      onExit?.({ ...args, type });

      previous$Records = previous$Records.filter((e) => e !== $record);
    } else {
      onUpdate?.({ ...args, type });
    }

    onChange?.({ ...args, type });
  });

  if (params.runOnInit) {
    const rows = store.getTable(tableId);

    // Run callbacks for all records in the query
    queries.forEachResultRow(queryId, ($record) => {
      const currentProperties = TinyBaseAdapter.decode(rows[$record]) as Properties<S, T>;

      const args = {
        tableId,
        $record: $record as $Record,
        properties: { current: currentProperties, prev: undefined },
        type: "enter" as UpdateType,
      };
      onEnter?.(args);
      onChange?.(args);

      previous$Records.push($record as $Record);
    });
  }

  return {
    unsubscribe: () => queries.delListener(listenerId),
  };
};
