import { queryToFragments } from "@/queries/utils";
import type { QueryOptions } from "@/queries/types";
import type { BaseTables, Tables } from "@/tables/types";
import { queries, type QueryFragment } from "@/lib/external/mud/queries";
import type { Entity } from "@/lib/external/mud/entity";
const { runQuery } = queries;

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
 * tables.Score.set({ points: 10 }, recordA);
 * tables.Score.set({ points: 10 }, recordB);
 * tables.Score.set({ points: 3 }, recordC);
 * tables.GameOver.set({ value: true }, recordB);
 *
 * const entities = query({
 *   withProperties: [{ table: tables.Score, properties: { points: 10 } }],
 *   without: [tables.GameOver],
 * });
 * console.log(entities);
 * // -> [ recordA ]
 * ```
 * @category Queries
 */
export const query = <tables extends BaseTables | Tables>(
  options: QueryOptions<tables>,
  fragments?: QueryFragment[],
): Entity[] => {
  if (fragments) return [...runQuery(fragments)];
  return [...runQuery(queryToFragments(options))];
};
