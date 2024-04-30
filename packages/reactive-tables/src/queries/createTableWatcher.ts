import { TinyBaseAdapter } from "@/adapter";
import { createTableTinyQLWatcher } from "@/queries";
import type { CreateTableWatcherOptions, CreateTableWatcherResult, TableUpdate, UpdateType } from "@/queries";
import type { Properties } from "@/tables";
import { type Schema, type $Record, uuid, getPropertiesAndTypeFromRowChange } from "@/lib";

/**
 * Create a watcher/listener for a table, either globally (on all changes) or within a TinyQL query.
 * This will listen to changes in the table (potentially only within the query) and trigger callbacks when records enter, exit, or change.
 *
 * Note: This function is directly provided as a table method, when using `table.watch()`.
 * Which abstracts a few parameters like `queries`, `tableId` and `schema`.
 *
 * Note: Refer to {@link createTableTinyQLWatcher} for the behavior when a TinyQL query is provided.
 *
 * @param queries The TinyBase queries object tied to the store containing properties for all records inside this table (abstracted).
 * @param tableId The id of the table to watch for changes (abstracted).
 * @param schema The schema of the properties for all records inside this table (abstracted).
 * @param onChange Callback triggered on any change in the table/query (encompassing enter, exit, and update).
 * @param onEnter Callback triggered when a record enters the table/query (`properties.prev` will be undefined).
 * @param onExit Callback triggered when a record exits the table/query (`properties.current` will be undefined).
 * @param onUpdate Callback triggered when the properties of a record are updated (within the query if provided).
 * @param options (optional) Additional options for the watcher. Currently only supports `runOnInit` to trigger the callbacks for all matching records on initialization.
 * @returns An object with an `unsubscribe` method to stop listening to the table.
 * @example
 * This example creates a watcher for all records within (with properties inside) the "Player" table.
 *
 * ```ts
 * const { registry, store } = createWrapper({ mudConfig });
 * const playerRecord = getPlayerRecord(); // for the sake of the example
 * registry.Player.set({ health: 100 }, playerRecord);
 *
 * // The function should be accessed from the table's methods
 * registry.Player.watch({
 *   onChange: (update) => console.log(update),
 * }, {
 *   runOnInit: false,
 * });
 * // no output
 *
 * registry.Player.update({ health: 90 }, playerRecord);
 * // -> { table: registry.Player, $record: playerRecord, current: { health: 90 }, prev: { health: 100 }, type: "change" }
 *
 * registry.Player.remove(playerRecord);
 * // -> { table: registry.Player, $record: playerRecord, current: undefined, prev: { health: 90 }, type: "exit" }
 * ```
 * @see {@link createTableTinyQLWatcher} for an example with a TinyQL query.
 * @see TinyQL for writing a query: https://tinybase.org/guides/making-queries/tinyql/
 * @category Queries
 * @internal
 */
export const createTableWatcher = <S extends Schema, T = unknown>({
  queries,
  query, // leave empty to listen to the whole table
  tableId,
  schema,
  onChange,
  onEnter,
  onExit,
  onUpdate,
  options = { runOnInit: true },
}: CreateTableWatcherOptions<S, T>): CreateTableWatcherResult => {
  // If a query is provided, define it and create the listener
  if (query) {
    const queryId = uuid();
    queries.setQueryDefinition(queryId, tableId, query);
    return createTableTinyQLWatcher({ queries, queryId, tableId, schema, onChange, onEnter, onExit, options });
  }

  if (!onChange && !onEnter && !onExit && !onUpdate) {
    throw new Error("At least one callback has to be provided");
  }

  // If not, just listen to the whole table
  const store = queries.getStore();
  // Get the keys to be able to aggregate the full properties from each cell
  const keys = Object.keys(schema);

  // This will be triggered on any change to a row/cell (meaning all properties or just a single one)
  const listenerId = store.addRowListener(tableId, null, (_, __, rowId, getCellChange) => {
    // If `getCellChange` is undefined, it means that `store.callListener()` was called
    if (!getCellChange) return;
    const $record = rowId as $Record;

    // Gather the properties and type of the change
    const args = getPropertiesAndTypeFromRowChange(getCellChange, keys, tableId, $record) as TableUpdate<S, T>;

    // Run the callbacks
    if (args.type === "enter") {
      onEnter?.(args);
    } else if (args.type === "exit") {
      onExit?.(args);
    } else {
      onUpdate?.(args);
    }

    onChange?.(args);
  });

  if (options.runOnInit) {
    const rows = store.getTable(tableId);

    // Run callbacks for all records in the query
    Object.entries(rows).forEach(([rowId, rowContent]) => {
      const currentProperties = TinyBaseAdapter.decode(rowContent) as Properties<S, T>;

      const args = {
        tableId,
        $record: rowId as $Record,
        properties: { current: currentProperties, prev: undefined },
        type: "enter" as UpdateType,
      };
      onEnter?.(args);
      onChange?.(args);
    });
  }

  return {
    unsubscribe: () => store.delListener(listenerId),
  };
};
