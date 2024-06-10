import type { BaseTableMetadata } from "@/tables";
import type { TableWatcherOptions, TableUpdate, TableWatcherParams } from "@/queries";
import { systems, type Schema } from "@/lib";

/**
 * Create a watcher/listener for a table, on all changes or selective ones (enter, exit, change, any update).
 * This will listen to changes in the table and trigger callbacks when entities enter, exit, or change.
 *
 * Note: This function is directly provided as a table method, when using `table.watch()`.
 *
 * @param options The {@link TableWatcherOptions}options for creating the table watcher.
 * - `world` The RECS world containing the table to watch (abstracted).
 * - `table` The table to watch for changes (abstracted).
 * - `onChange` Callback triggered on any change in the table/query (encompassing enter, exit, and update).
 * - `onEnter` Callback triggered when an entity enters the table/query (`properties.prev` will be undefined).
 * - `onExit` Callback triggered when an entity exits the table/query (`properties.current` will be undefined).
 * - `onUpdate` Callback triggered when the properties of an entity are updated (within the query if provided).
 * @param params Additional {@link TableWatcherParams} for the watcher.
 * - `runOnInit` Whether to trigger the callbacks for all entities on initialization (default: `true`).
 * @example
 * This example creates a watcher for all entities within (with properties inside) the "Player" table.
 *
 * ```ts
 * const { tables, store } = createWrapper({ world, mudConfig });
 * registry.Player.set({ health: 100 }, playerRecord);
 *
 * // The function should be accessed from the table's methods
 * const { unsubscribe } = registry.Player.watch({
 *   onChange: (update) => console.log(update),
 * }, {
 *   runOnInit: false,
 * });
 * // no output
 *
 * registry.Player.update({ health: 90 }, playerRecord);
 * // -> { table: registry.Player, entity: playerRecord, current: { health: 90 }, prev: { health: 100 }, type: "change" }
 *
 * registry.Player.remove(playerRecord);
 * // -> { table: registry.Player, entity: playerRecord, current: undefined, prev: { health: 90 }, type: "exit" }
 *
 * // Unsubscribe from the watcher once you're done or when disposing of the component
 * // This will be done automatically when disposing of the world
 * unsubscribe();
 * ```
 * @category Queries
 * @internal
 */
export const createTableWatcher = <PS extends Schema, M extends BaseTableMetadata, T = unknown>(
  options: TableWatcherOptions<PS, M, T>,
  params: TableWatcherParams = { runOnInit: true },
) => {
  const { world, table, onChange, onEnter, onExit, onUpdate } = options;
  if (!onChange && !onEnter && !onExit && !onUpdate) {
    throw new Error("At least one callback has to be provided");
  }

  systems().defineTableSystem(
    world,
    table,
    (_update) => {
      const update = _update as TableUpdate<PS, M, T>;
      onUpdate?.(update);
      if (update.type === "change") onChange?.(update);
      if (update.type === "enter") onEnter?.(update);
      if (update.type === "exit") onExit?.(update);
    },
    params,
  );
};
