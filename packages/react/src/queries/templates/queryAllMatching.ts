import { Entity } from "@latticexyz/recs";
import { createQueries } from "tinybase/queries";

import { queryAllWithValue } from "@/queries/templates/queryAllWithValue";
import { ComponentValue } from "@/components/types";
import { AbiToSchemaPlusMetadata, ContractTable } from "@/components/contract/types";
import { MUDTable, TinyBaseStore } from "@/lib";

type QueryMatchingComponentValue<table extends MUDTable, T = unknown> = {
  component: ContractTable<table>;
  value: ComponentValue<AbiToSchemaPlusMetadata<table["valueSchema"]>, T>;
};
// Query all entities matching all of the given conditions:
// At least an inside or with condition needs to be provided for intial filtering
// TODO: fix type inference on heterogeneous array (with single MUDTable it wants the same table as the first one for all items)
export type QueryAllMatchingOptions<tables extends MUDTable[], T = unknown> = {
  inside?: ContractTable<tables[number]>[]; // inside these components
  with?: QueryMatchingComponentValue<tables[number], T>[]; // with the specified values for their associated components
  notInside?: ContractTable<tables[number]>[]; // not inside these components
  without?: QueryMatchingComponentValue<tables[number], T>[]; // without the specified values for their associated components
};

// Query all entities matching multiple conditions across tables
// TODO: this surely can be optimized, but right now we need something that works at least
// Needs to be benchmarked to see from which point it makes sense getting entire tables once and filtering them in memory
export const queryAllMatching = <tables extends MUDTable[], T = unknown>(
  store: TinyBaseStore,
  options: QueryAllMatchingOptions<tables, T>,
): Entity[] => {
  const { inside, notInside, with: withValues, without: withoutValues } = options;
  if (!inside && !withValues) {
    throw new Error("At least one inside or with condition needs to be provided");
  }

  const queries = createQueries(store);

  /* --------------------------------- INSIDE --------------------------------- */
  // Start with entities inside all inside components
  let entities = inside
    ? inside.reduce<Entity[]>((acc, component) => {
        return (
          component
            // get all entities inside this component
            .getAll()
            // keep them if they were inside previous components as well
            .filter((entity) => (acc.length > 0 ? acc.includes(entity) : true))
        );
      }, [])
    : [];

  /* ---------------------------------- WITH ---------------------------------- */
  // Keep entities with all given values (or init if no previous condition was given)
  withValues?.forEach(({ component, value }, i) => {
    const { id: queryId, entities: entitiesWithValue } = queryAllWithValue({ queries, tableId: component.id, value });
    // If no previous condition was given, init with the first component's entities
    if (inside === undefined && i === 0) {
      entities = entitiesWithValue;
      if (i === withValues.length - 1) queries.delQueryDefinition(queryId);
      return;
    }
    // If inside was given (or already iterated once), find out if among entities with the given value there are
    // entities that are already matching previous conditions
    entities = entitiesWithValue.filter((entity) => entities.includes(entity));

    // Remove query definition on the last iteration
    if (i === withValues.length - 1) queries.delQueryDefinition(queryId);
  });

  /* ------------------------------- NOT INSIDE ------------------------------- */
  // Remove entities not inside any notInside component
  notInside?.forEach((component) => {
    // TODO: what is quicker: getAll() in component then filter out, or component.has() (underlying store.hasRow())
    entities = entities.filter((entity) => !component.has(entity));
  });

  /* -------------------------------- WITHOUT --------------------------------- */
  // Remove entities with any of the given values
  withoutValues?.forEach(({ component, value }, i) => {
    // we could use queryAllWithoutValues but it seems more likely that this below will return less entities to iterate over
    const { id: queryId, entities: entitiesWithValue } = queryAllWithValue({ queries, tableId: component.id, value });
    entities = entities.filter((entity) => !entitiesWithValue.includes(entity));

    if (i === withoutValues.length - 1) queries.delQueryDefinition(queryId);
  });

  return entities;
};
