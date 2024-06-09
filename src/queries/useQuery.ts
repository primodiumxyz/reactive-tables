import { useEffect, useMemo, useState } from "react";

import { query, type QueryOptions, type TableWatcherCallbacks, type TableUpdate } from "@/queries";
import { queries, type $Record } from "@/lib";

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
 * @param callbacks (optional) The {@link TableWatcherCallbacks} to trigger on changes. Including: onChange, onEnter, onExit, onUpdate.
 * These will trigger a {@link TableUpdate} object with the id of the updated table, the record, the previous and new properties of the record and the type of update.
 * @returns An array of {@link $Record} matching all conditions.
 * @example
 * This example queries all records that have a score of 10 in the "Score" table and are not inside the "GameOver" table.
 *
 * ```ts
 * const { registry, store } = createWrapper({ world, mudConfig });
 * registry.Score.set({ points: 10 }, recordA);
 * registry.Score.set({ points: 10 }, recordB);
 * registry.Score.set({ points: 3 }, recordC);
 * registry.GameOver.set({ value: true }, recordB);
 *
 * const records = useQuery(store, {
 *   withProperties: [ { table: registry.Score, properties: { points: 10 } } ],
 *   without: [ registry.GameOver ],
 * }, {
 *   onChange: (update) => console.log(update),
 * });
 * console.log(records);
 * // -> [ recordA ]
 *
 * registry.Score.update({ points: 10 }, recordC);
 * // -> { table: registry.Score, $record: recordC, current: { points: 10 }, prev: { points: 3 }, type: "change" }
 * console.log(records);
 * // -> [ recordA, recordC ]
 * ```
 * @category Queries
 */
export const useQuery = (options: QueryOptions, callbacks?: TableWatcherCallbacks): $Record[] => {
  // Not available in a non-browser environment
  if (typeof window === "undefined") throw new Error("useQuery is only available in a browser environment");
  const { with: inside, without: notInside, withProperties, withoutProperties } = options;
  const { onChange, onEnter, onExit, onUpdate } = callbacks ?? {};

  const [records, setRecords] = useState<$Record[]>([]);

  const queryFragments = useMemo(
    () => [
      ...(inside?.map((fragment) => queries.With(fragment)) ?? []),
      ...(withProperties?.map((matching) => queries.WithProperties(matching.table, { ...matching.properties })) ?? []),
      ...(notInside?.map((table) => queries.Without(table)) ?? []),
      ...(withoutProperties?.map((matching) => queries.WithoutProperties(matching.table, { ...matching.properties })) ??
        []),
    ],
    [options],
  );

  useEffect(() => {
    setRecords(query(options, queryFragments)); // will throw if no positive fragment

    // fix: if pre-populated with state, useComponentValue doesn’t update when there’s a component that has been removed.
    const queryResult = queries.defineQuery(queryFragments, { runOnInit: true });
    const subscription = queryResult.update$.subscribe((_update) => {
      const update = _update as TableUpdate<
        (typeof _update)["table"]["propertiesSchema"],
        (typeof _update)["table"]["metadata"]
      >; // TODO: test if weird type casting useful
      onUpdate?.(update);
      if (update.type === "change") {
        // record is changed within the query so no need to update records
        onChange?.(update);
      } else if (update.type === "enter") {
        setRecords((prev) => [...prev, update.$record]);
        onEnter?.(update);
      } else if (update.type === "exit") {
        setRecords((prev) => prev.filter((record) => record !== update.$record));
        onExit?.(update);
      }
    });

    return () => subscription.unsubscribe();
  }, [options, queryFragments]);

  return records;
};
