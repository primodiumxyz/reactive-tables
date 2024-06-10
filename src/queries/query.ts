import type { QueryOptions } from "@/queries";
import { queries, type QueryFragment, type Entity } from "@/lib";
const { runQuery, With, WithProperties, Without, WithoutProperties } = queries();

/**
 * Queries all entities matching multiple provided conditions across tables.
 *
 * Note: See {@link QueryOptions} for more details on conditions criteria.
 *
 * @param options The {@link QueryOptions} object containing the conditions to match.
 * @param fragments (optional) Query fragments to bypass the options conversion and directly provide the resulting fragments.
 * @returns An array of {@link Entity} objects matching all conditions.
 * @example
 * This example queries all entities that have a score of 10 in the "Score" table and are not inside the "GameOver" table.
 *
 * ```ts
 * const { tables } = createWrapper({ world, mudConfig });
 * registry.Score.set({ points: 10 }, recordA);
 * registry.Score.set({ points: 10 }, recordB);
 * registry.Score.set({ points: 3 }, recordC);
 * registry.GameOver.set({ value: true }, recordB);
 *
 * const entities = query({
 *   withProperties: [{ table: registry.Score, properties: { points: 10 } }],
 *   without: [registry.GameOver],
 * });
 * console.log(entities);
 * // -> [ recordA ]
 * ```
 * @category Queries
 */
export const query = (options: QueryOptions, fragments?: QueryFragment[]): Entity[] => {
  const { with: inside, without: notInside, withProperties, withoutProperties } = options;
  if (!fragments && !inside && !withProperties) {
    throw new Error("At least one `with` or `withProperties` condition needs to be provided");
  }

  if (fragments) return [...runQuery(fragments)];
  return [
    ...runQuery([
      ...(inside?.map((fragment) => With(fragment)) ?? []),
      ...(withProperties?.map((matching) => WithProperties(matching.table, { ...matching.properties })) ?? []),
      ...(notInside?.map((table) => Without(table)) ?? []),
      ...(withoutProperties?.map((matching) => WithoutProperties(matching.table, { ...matching.properties })) ?? []),
    ]),
  ];
};
