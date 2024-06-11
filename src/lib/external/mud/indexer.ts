import type { BaseTable, BaseTableMetadata, Properties } from "@/tables/types";
import { type Entity, type EntitySymbol, getEntityHex, getEntitySymbol } from "@/lib/external/mud/entity";
import type { Schema } from "@/lib/external/mud/schema";
import { tableOperations } from "@/lib/external/mud/tables";

/**
 * Create an indexed table from a given table.
 *
 * Note: Modified from RECS.
 *
 * @remarks
 * An indexed table keeps a "reverse mapping" from {@link Properties} to the Set of entities with this properties.
 * This adds a performance overhead to modifying table properties and a memory overhead since in the worst case there is one
 * Set per entity (if every entity has different properties).
 * In return the performance for querying for entities with given table properties is close to O(1) (instead of O(#entities) in a regular non-indexed table).
 * As a rule of thumb only tables that are added to many entities and are queried with {@link HasValue} a lot should be indexed (eg. the Position table).
 *
 * @dev (MUD) This could be made more (memory) efficient by using a hash of the component properties as key, but would require handling hash collisions.
 *
 * @param table base table to index.
 * @returns Indexed version of the table.
 */
export const createIndexer = <S extends Schema, M extends BaseTableMetadata, T = unknown>(
  table: BaseTable<S, M, T>,
): BaseTable<S, M, T> & {
  getEntitiesWithProperties: (properties: Properties<S, T>) => Set<Entity>;
} => {
  const propertiesToEntities = new Map<string, Set<EntitySymbol>>();

  function getEntitiesWithProperties(properties: Properties<S, T>) {
    const entities = propertiesToEntities.get(getPropertiesKey(properties));
    return entities ? new Set([...entities].map(getEntityHex)) : new Set<Entity>();
  }

  function getPropertiesKey(properties: Properties<S, T>): string {
    return Object.values(properties).join("/");
  }

  function add(entity: EntitySymbol, properties: Properties<S, T> | undefined) {
    if (!properties) return;
    const propertiesKey = getPropertiesKey(properties);
    let entitiesWithProperties = propertiesToEntities.get(propertiesKey);
    if (!entitiesWithProperties) {
      entitiesWithProperties = new Set<EntitySymbol>();
      propertiesToEntities.set(propertiesKey, entitiesWithProperties);
    }
    entitiesWithProperties.add(entity);
  }

  function remove(entity: EntitySymbol, properties: Properties<S, T> | undefined) {
    if (!properties) return;
    const propertiesKey = getPropertiesKey(properties);
    const entitiesWithProperties = propertiesToEntities.get(propertiesKey);
    if (!entitiesWithProperties) return;
    entitiesWithProperties.delete(entity);
  }

  // Initial indexing
  for (const entity of table.entities()) {
    const properties = tableOperations.getEntityProperties(table, entity);
    add(getEntitySymbol(entity), properties);
  }

  // Keeping index up to date
  const subscription = table.update$.subscribe(({ entity, properties }) => {
    // Remove from previous location
    remove(getEntitySymbol(entity), properties.prev);

    // Add to new location
    add(getEntitySymbol(entity), properties.current);
  });

  table.world.registerDisposer(() => subscription?.unsubscribe());

  return { ...table, getEntitiesWithProperties };
};
