import { useEffect, useMemo, useRef, useState } from "react";

import type { QueryOptions, TableWatcherCallbacks, TableUpdate, TableWatcherParams } from "@/queries/types";
import { type Entity } from "@/lib/external/mud/entity";
import { queries, QueryFragmentType, useDeepMemo } from "@/lib/external/mud/queries";
import { tableOperations } from "@/lib/external/mud/tables";
const { getEntityProperties } = tableOperations;
const { defineQuery, With, WithProperties, Without, WithoutProperties } = queries;

/**
 * React hook to query all entities matching multiple conditions across tables.
 *
 * This will return an array of Entity objects matching all conditions, and will trigger the provided callbacks on changes.
 *
 * Note: See {@link QueryOptions} for more details on conditions criteria.
 *
 * Note: This hook will only trigger on changes after it's mounted, not on creation for all initial matching entities.
 *
 * @param store The TinyBase store containing the properties associated with contract tables.
 * @param options The {@link QueryOptions} object containing the conditions to match.
 * @param callbacks (optional) The {@link TableWatcherCallbacks} to trigger on changes. Including: onChange, onEnter, onExit, onUpdate.
 * These will trigger a {@link TableUpdate} object with the id of the updated table, the entity, the previous and new properties of the entity and the type of update.
 * @param params (optional) Additional {@link TableWatcherParams} for the query. Currently only supports `runOnInit` to trigger the callbacks for all matching entities on initialization.
 * @returns An array of {@link Entity} matching all conditions.
 * @example
 * This example queries all entities that have a score of 10 in the "Score" table and are not inside the "GameOver" table.
 *
 * ```ts
 * const { tables } = createWrapper({ world, mudConfig });
 * tables.Score.set({ points: 10 }, recordA);
 * tables.Score.set({ points: 10 }, recordB);
 * tables.Score.set({ points: 3 }, recordC);
 * tables.GameOver.set({ value: true }, recordB);
 *
 * const entities = useQuery({
 *   withProperties: [ { table: tables.Score, properties: { points: 10 } } ],
 *   without: [ tables.GameOver ],
 * }, {
 *   onChange: (update) => console.log(update),
 * });
 * console.log(entities);
 * // -> [ recordA ]
 *
 * tables.Score.update({ points: 10 }, recordC);
 * // -> { table: tables.Score, entity: recordC, current: { points: 10 }, prev: { points: 3 }, type: "change" }
 * console.log(entities);
 * // -> [ recordA, recordC ]
 * ```
 * @category Queries
 */
export const useQuery = (
  options: QueryOptions,
  callbacks?: TableWatcherCallbacks,
  params: TableWatcherParams = {
    runOnInit: true,
  },
): Entity[] => {
  // Not available in a non-browser environment
  if (typeof window === "undefined") throw new Error("useQuery is only available in a browser environment");
  const { with: inside, without: notInside, withProperties, withoutProperties } = options;
  const { onChange, onEnter, onExit, onUpdate } = callbacks ?? {};

  const queryFragments = useDeepMemo([
    ...(inside?.map((fragment) => With(fragment)) ?? []),
    ...(withProperties?.map((matching) => WithProperties(matching.table, { ...matching.properties })) ?? []),
    ...(notInside?.map((table) => Without(table)) ?? []),
    ...(withoutProperties?.map((matching) => WithoutProperties(matching.table, { ...matching.properties })) ?? []),
  ]);

  const query = useMemo(() => defineQuery(queryFragments, { runOnInit: true }), [queryFragments, params]);
  const [entities, setRecords] = useState<Entity[]>([...query.matching]); // will throw if no positive fragment
  const mounted = useRef(false);

  useEffect(() => {
    setRecords([...query.matching]);

    // fix: if pre-populated with state, useComponentValue doesn’t update when there’s a component that has been removed.
    const subscription = query.update$.subscribe((_update) => {
      if (!mounted.current) return; // we want to control run on init

      const update = _update as TableUpdate<
        (typeof _update)["table"]["propertiesSchema"],
        (typeof _update)["table"]["metadata"]
      >; // TODO: test if weird type casting useful
      onUpdate?.(update);
      if (update.type === "change") {
        // entity is changed within the query so no need to update entities
        onChange?.(update);
      } else if (update.type === "enter") {
        setRecords((prev) => [...prev, update.entity]);
        onEnter?.(update);
      } else if (update.type === "exit") {
        setRecords((prev) => prev.filter((entity) => entity !== update.entity));
        onExit?.(update);
      }
    });

    // perform run on init if needed
    if (params.runOnInit) {
      const enterTable = queryFragments.find(
        (fragment) => fragment.type === QueryFragmentType.With || fragment.type === QueryFragmentType.WithProperties,
      )!.table;
      query.matching.forEach((entity) => {
        const update = {
          table: enterTable,
          entity,
          properties: { current: getEntityProperties(enterTable, entity), prev: undefined },
          type: "enter",
        } as const satisfies TableUpdate;

        onEnter?.(update);
        onUpdate?.(update);
      });
    }

    mounted.current = true;
    return () => subscription.unsubscribe();
  }, [options, queryFragments]);

  return [...new Set(entities)];
};
