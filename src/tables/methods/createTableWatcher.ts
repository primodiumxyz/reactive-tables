import type { BaseTableMetadata } from "@/tables/types";
import type { TableWatcherOptions, TableUpdate, TableWatcherParams } from "@/queries/types";
import type { Schema } from "@/lib/external/mud/schema";
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
 * - `onChange` Callback triggered on any change in the table/query (encompassing enter, exit, and update).
 * - `onEnter` Callback triggered when an entity enters the table/query (`properties.prev` will be undefined).
 * - `onExit` Callback triggered when an entity exits the table/query (`properties.current` will be undefined).
 * - `onUpdate` Callback triggered when the properties of an entity are updated (within the query if provided).
 * @param params Additional {@link TableWatcherParams} for the watcher.
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
 * // -> { table: tables.Player, entity: playerRecord, current: { health: 90 }, prev: { health: 100 }, type: "change" }
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
) => {
  const { world, table, onChange, onEnter, onExit, onUpdate } = options;
  if (!onChange && !onEnter && !onExit && !onUpdate) {
    throw new Error("At least one callback has to be provided");
  }

  systems.defineTableSystem(
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
