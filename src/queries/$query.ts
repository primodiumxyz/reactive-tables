import type { QueryOptions, TableWatcherCallbacks, TableWatcherParams } from "@/queries";
import { queries, systems, type World } from "@/lib";
const { With, WithProperties, Without, WithoutProperties } = queries();

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
 * @param world The RECS world containing the tables to watch.
 * @param queryOptions The {@link QueryOptions} object containing the conditions to match.
 * @param callbacks The {@link TableWatcherCallbacks} to trigger on changes. Including: onChange, onEnter, onExit, onUpdate.
 * These will trigger a {@link TableUpdate} object inside the id of the updated table, the record, the previous and new properties of the record and the type of update.
 * @param options (optional) Additional options for the query. Currently only supports `runOnInit` to trigger the callbacks for all matching records on initialization.
 * @returns An object inside an `unsubscribe` method to stop listening to the query.
 * @example
 * This example creates a query that listens to all records that represent online players notInside a score of 0.
 *
 * ```ts
 * const { tables } = createWrapper({ world, mudConfig });
 * tables.Player.set({ score: 10, online: true }, recordA);
 * tables.Player.set({ score: 0, online: true }, recordB);
 * tables.Player.set({ score: 10, online: false }, recordC);
 *
 * const { unsubscribe } = $query(store, {
 *   withProperties: [{ table: tables.Player, properties: { online: true } }],
 *   withoutProperties: [{ table: tables.Player, properties: { score: 0 } }],
 * }, {
 *  onEnter: (update) => console.log(update),
 *  onExit: (update) => console.log(update),
 * }, { runOnInit: true }); // this is the default behavior
 * // -> { table: undefined, $record: recordA, current: undefined, prev: undefined, type: "enter" }
 *
 * tables.Player.update({ score: 15 }, recordA);
 * // -> { table: tables.Player, $record: recordA, current: { online: true, score: 15 }, prev: { online: true, score: 10 }, type: "change" }
 *
 * tables.Player.update({ online: false }, recordA);
 * // -> { table: tables.Player, $record: recordA, current: { online: false, score: 15 }, prev: { online: true, score: 15 }, type: "change" }
 * ```
 * @category Queries
 */
export const $query = (
  world: World,
  queryOptions: QueryOptions,
  callbacks: TableWatcherCallbacks,
  params: TableWatcherParams = { runOnInit: true },
) => {
  const { onChange, onEnter, onExit, onUpdate } = callbacks;
  if (!onChange && !onEnter && !onExit && !onUpdate) {
    throw new Error("At least one callback has to be provided");
  }

  const { with: inside, without: notInside, withProperties, withoutProperties } = queryOptions;
  if (!inside && !withProperties) {
    throw new Error("At least one `with` or `withProperties` condition needs to be provided");
  }

  systems().defineSystem(
    world,
    [
      ...(inside?.map((fragment) => With(fragment)) ?? []),
      ...(withProperties?.map((matching) => WithProperties(matching.table, { ...matching.properties })) ?? []),
      ...(notInside?.map((table) => Without(table)) ?? []),
      ...(withoutProperties?.map((matching) => WithoutProperties(matching.table, { ...matching.properties })) ?? []),
    ],
    (update) => {
      onUpdate?.(update);
      if (update.type === "change") onChange?.(update);
      if (update.type === "enter") onEnter?.(update);
      if (update.type === "exit") onExit?.(update);
    },
    params,
  );
};
