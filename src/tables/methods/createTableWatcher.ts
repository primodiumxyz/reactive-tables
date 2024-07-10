import type { TableUpdate } from "@/tables/types";
import type { TableWatcherOptions, TableWatcherParams } from "@/queries/types";
import type { BaseTableMetadata, Schema } from "@/lib/external/mud/schema";
import { systems } from "@/lib/external/mud/systems";

/**
 * Create a watcher/listener for a table, on all changes or selective ones (enter, exit, change, any update).
 * This will listen to changes in the table and trigger callbacks when entities enter, exit, or change.
 *
 * Note: This function is directly provided as a table method, when using `table.watch()`.
 *
 * @param options The {@link TableWatcherOptions} for creating the table watcher.
 * - `world` The RECS world containing the table to watch.
 * - `table` The table to watch for changes.
 * - `onUpdate` Callback triggered when the properties of an entity are updated (within the query if provided).
 * - `onEnter` Callback triggered when an entity enters the table/query (`properties.prev` will be undefined).
 * - `onExit` Callback triggered when an entity exits the table/query (`properties.current` will be undefined).
 * - `onChange` Callback triggered on any change in the table/query (encompassing enter, exit, and update).
 * @param params Additional {@link TableWatcherParams} for the watcher.
 * @returns Function to unsubscribe from the listener.
 * @example
 * This example creates a watcher for all entities within (with properties inside) the "Player" table.
 *
 * ```ts
 * const { tables } = createWrapper({ world, mudConfig });
 * tables.Player.set({ health: 100 }, playerRecord);
 *
 * // The function should be accessed from the table's methods
 * createTableWatcher({
 *   world,
 *   table: tables.Player,
 *   onChange: (update) => console.log(update),
 * }, {
 *   runOnInit: false,
 * });
 * // no output
 *
 * tables.Player.update({ health: 90 }, playerRecord);
 * // -> { table: tables.Player, entity: playerRecord, current: { health: 90 }, prev: { health: 100 }, type: "update" }
 *
 * tables.Player.remove(playerRecord);
 * // -> { table: tables.Player, entity: playerRecord, current: undefined, prev: { health: 90 }, type: "exit" }
 * ```
 * @category Queries
 * @internal
 */
export const createTableWatcher = <PS extends Schema, M extends BaseTableMetadata, T = unknown>(
  options: TableWatcherOptions<PS, M, T>,
  params: TableWatcherParams = { runOnInit: true },
): (() => void) => {
  const { world, table, onUpdate, onEnter, onExit, onChange } = options;
  if (!onUpdate && !onEnter && !onExit && !onChange) {
    throw new Error("At least one callback has to be provided");
  }

  return systems.defineTableSystem(
    world ?? table.world,
    table,
    (_update) => {
      const update = _update as TableUpdate<PS, M, T>;
      onChange?.(update);
      if (update.type === "update") onUpdate?.(update);
      if (update.type === "enter") onEnter?.(update);
      if (update.type === "exit") onExit?.(update);
    },
    params,
  );
};
