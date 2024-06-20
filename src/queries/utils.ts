import type { QueryPropertiesCondition, QueryOptions, QueryMatchingCondition } from "@/queries/types";
import type { BaseTable, BaseTables } from "@/tables/types";
import { queries, type QueryFragments } from "@/lib/external/mud/queries";
import type { Properties } from "@/lib/external/mud/schema";

const { With, WithProperties, Without, WithoutProperties, MatchingProperties } = queries;

// TODO: we're not specifying `QueryPropertiesCondition<table>` because it becomes too specific for the TableOptions,
// as they are not aware of the precise types until provided;
// once solved, these fonctions won't be necessary anymore.
export const queryPropertiesCondition = <table extends BaseTable>({
  table,
  properties,
}: {
  table: table;
  properties: Partial<Properties<table["propertiesSchema"]>>;
}): QueryPropertiesCondition => ({ table, properties }) as QueryPropertiesCondition;

export const queryMatchingCondition = <table extends BaseTable>({
  table,
  where,
}: {
  table: table;
  where: (properties: Properties<table["propertiesSchema"]>) => boolean;
}): QueryMatchingCondition => ({ table, where }) as QueryMatchingCondition;

export const queryToFragments = <tables extends BaseTables>(query: QueryOptions<tables>): QueryFragments => {
  const { with: inside, without: notInside, withProperties, withoutProperties, matching } = query;
  if (!inside && !withProperties) {
    throw new Error("At least one `with` or `withProperties` condition needs to be provided");
  }

  return [
    ...(inside?.map((fragment) => With(fragment)) ?? []),
    ...(withProperties?.map((matching) => WithProperties(matching.table, { ...matching.properties })) ?? []),
    ...(notInside?.map((table) => Without(table)) ?? []),
    ...(withoutProperties?.map((matching) => WithoutProperties(matching.table, { ...matching.properties })) ?? []),
    ...(matching?.map((matching) => MatchingProperties(matching.table, matching.where)) ?? []),
  ];
};
