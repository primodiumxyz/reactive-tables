import type { QueryOptions, TableWatcherParams, WatcherOptions } from "@/queries/types";
import type { BaseTables, Tables } from "@/tables/types";
import { systems } from "@/lib/external/mud/systems";
import { queryToFragments } from "./utils";

/**
 * Listen to all entities matching multiple conditions across tables.
 *
 * This will trigger the provided callbacks whenever an entity enters or exits the query conditions, or when its properties change
 * within the query conditions.
 *
 * Note: This is related to ${@link query} (direct retrieval based on conditions) and ${@link useQuery} (React hook inside callbacks + real-time retrieval).
 *
 * Note: See {@link QueryOptions} for more details on conditions criteria.
 *
 * @param query The {@link QueryOptions} object containing the conditions to match.
 * @param options The {@link WatcherOptions} with the world object and callbacks to trigger on changes. Including: onUpdate, onEnter, onExit, onChange.
 * These will trigger a {@link TableUpdate} object inside the id of the updated table, the entity, the previous and new properties of the entity and the type of update.
 * @param params (optional) Additional {@link TableWatcherParams} for the query. Currently only supports `runOnInit` to trigger the callbacks for all matching entities on initialization.
 * @example
 * This example creates a query that listens to all entities that represent online players notInside a score of 0.
 *
 * ```ts
 * const { tables } = createWrapper({ world, mudConfig });
 * tables.Player.set({ score: 10, online: true }, recordA);
 * tables.Player.set({ score: 0, online: true }, recordB);
 * tables.Player.set({ score: 10, online: false }, recordC);
 *
 * $query(world, {
 *   withProperties: [{ table: tables.Player, properties: { online: true } }],
 *   withoutProperties: [{ table: tables.Player, properties: { score: 0 } }],
 * }, {
 *  onEnter: (update) => console.log(update),
 *  onExit: (update) => console.log(update),
 * }, { runOnInit: true }); // this is the default behavior
 * // -> { table: tables.Player, entity: recordA, current: { score: 10, online: true }, prev: undefined, type: "enter" }
 *
 * tables.Player.update({ score: 15 }, recordA);
 * // -> { table: tables.Player, entity: recordA, current: { online: true, score: 15 }, prev: { online: true, score: 10 }, type: "update" }
 *
 * tables.Player.update({ online: false }, recordA);
 * // -> { table: tables.Player, entity: recordA, current: { online: false, score: 15 }, prev: { online: true, score: 15 }, type: "update" }
 * ```
 * @category Queries
 */
export const $query = <tables extends BaseTables | Tables>(
  query: QueryOptions<tables>,
  options: WatcherOptions<tables>,
  params: TableWatcherParams = { runOnInit: true },
) => {
  const { world, onUpdate, onEnter, onExit, onChange } = options;
  if (!onUpdate && !onEnter && !onExit && !onChange) {
    throw new Error("At least one callback has to be provided");
  }

  systems.defineSystem(
    // one will necessarily be defined, otherwise no positive fragment -> will throw
    world ?? query.with?.[0].world ?? query.withProperties?.[0].table.world,
    queryToFragments(query),
    (update) => {
      onChange?.(update);
      if (update.type === "update") onUpdate?.(update);
      if (update.type === "enter") onEnter?.(update);
      if (update.type === "exit") onExit?.(update);
    },
    params,
  );
};
