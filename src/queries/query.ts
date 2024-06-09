import type { QueryOptions } from "@/queries";
import { queries, type QueryFragment, type $Record } from "@/lib";

/**
 * Queries all records matching multiple provided conditions across tables.
 *
 * Note: See {@link QueryOptions} for more details on conditions criteria.
 *
 * @param options The {@link QueryOptions} object containing the conditions to match.
 * @param fragments (optional) Query fragments to bypass the options conversion and directly provide the resulting fragments.
 * @returns An array of {@link $Record} objects matching all conditions.
 * @example
 * This example queries all records that have a score of 10 in the "Score" table and are not inside the "GameOver" table.
 *
 * ```ts
 * const { tables } = createWrapper({ world, mudConfig });
 * registry.Score.set({ points: 10 }, recordA);
 * registry.Score.set({ points: 10 }, recordB);
 * registry.Score.set({ points: 3 }, recordC);
 * registry.GameOver.set({ value: true }, recordB);
 *
 * const records = query({
 *   withProperties: [{ table: registry.Score, properties: { points: 10 } }],
 *   without: [registry.GameOver],
 * });
 * console.log(records);
 * // -> [ recordA ]
 * ```
 * @category Queries
 */
export const query = (options: QueryOptions, fragments?: QueryFragment[]): $Record[] => {
  const { with: inside, without: notInside, withProperties, withoutProperties } = options;
  if (!fragments && !inside && !withProperties) {
    throw new Error("At least one `with` or `withProperties` condition needs to be provided");
  }

  if (fragments) return [...queries.runQuery(fragments)];
  return [
    ...queries.runQuery([
      ...(inside?.map((fragment) => queries.With(fragment)) ?? []),
      ...(withProperties?.map((matching) => queries.WithProperties(matching.table, { ...matching.properties })) ?? []),
      ...(notInside?.map((table) => queries.Without(table)) ?? []),
      ...(withoutProperties?.map((matching) => queries.WithoutProperties(matching.table, { ...matching.properties })) ??
        []),
    ]),
  ];
};
