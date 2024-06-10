import { map, pipe } from "rxjs";
import isEqual from "fast-deep-equal";

import type { BaseTableMetadata, IndexedBaseTable, Properties, BaseTable } from "@/tables";
import type { TableUpdate } from "@/queries";
import { OptionalTypes, getEntitySymbol, type Entity, type Schema } from "@/lib";

export type TableMutationOptions = {
  skipUpdateStream?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTableName(table: BaseTable<any, any, any>) {
  return (
    table.metadata?.name ??
    table.metadata?.globalName ??
    table.metadata?.tableId ??
    table.metadata?.contractId ??
    table.id
  );
}

// All of the following code is taken and modified from MUD to fit new types and naming conventions.

export const tableOperations = () => {
  /**
   * Set the properties for a given entity in a given table.
   *
   * Note: Modified from RECS.
   *
   * @param table {@link createTable BaseTable} to be updated.
   * @param entity {@link Entity} whose properties in the given table should be set.
   * @param properties Properties to set, schema must match the table schema.
   *
   * @example
   * ```
   * tables.setEntity(Position, entity, { x: 1, y: 2 });
   * ```
   */
  const setEntity = <PS extends Schema, M extends BaseTableMetadata = BaseTableMetadata, T = unknown>(
    table: BaseTable<PS, M, T>,
    entity: Entity,
    properties: Properties<PS, T>,
    options: TableMutationOptions = {},
  ) => {
    const entitySymbol = getEntitySymbol(entity);
    const prevProperties = getEntityProperties(table, entity);

    for (const [key, val] of Object.entries(properties)) {
      if (table.properties[key]) {
        table.properties[key].set(entitySymbol, val);
      } else {
        const isTableFieldIndex = table.metadata?.tableId && /^\d+$/.test(key);
        if (!isTableFieldIndex) {
          // If this key looks like a field index from `defineStoreComponents`,
          // we can ignore this properties without logging anything.
          // Otherwise, we should let the user know we found undefined data.
          console.warn(
            "Table definition for",
            getTableName(table),
            "is missing key",
            key,
            ", ignoring properties",
            val,
            "for entity",
            entity,
            ". Existing keys: ",
            Object.keys(table.properties),
          );
        }
      }
    }

    if (!options.skipUpdateStream) {
      table.update$.next({
        entity,
        properties: { current: properties, prev: prevProperties },
        table,
        type: prevProperties ? (prevProperties === properties ? "noop" : "change") : "enter",
      });
    }
  };

  /**
   * Update the properties for a given entity in a given table while keeping the old properties of keys not included in the update.
   *
   * Note: Modified from RECS.
   *
   * @param table {@link createTable BaseTable} to be updated.
   * @param entity {@link Entity} whose properties in the given table should be updated.
   * @param properties Partial properties to be set, remaining keys will be taken from the existing table properties.
   *
   * @remarks
   * This function fails silently during runtime if partial properties are set for an entity that
   * does not have properties yet, since then partial properties will be set in the table for this entity.
   *
   * @example
   * ```
   * tables.updateEntity(Position, entity, { x: 1 });
   * ```
   */
  const updateEntity = <PS extends Schema, M extends BaseTableMetadata = BaseTableMetadata, T = unknown>(
    table: BaseTable<PS, M, T>,
    entity: Entity,
    properties: Partial<Properties<PS, T>>,
    initialProperties?: Properties<PS, T>,
    options: TableMutationOptions = {},
  ) => {
    const currentProperties = getEntityProperties(table, entity);
    if (currentProperties === undefined) {
      if (initialProperties === undefined) {
        throw new Error(`Can't update table ${getTableName(table)} without current or initial properties`);
      }

      setEntity(table, entity, { ...initialProperties, ...properties }, options);
    } else {
      setEntity(table, entity, { ...currentProperties, ...properties }, options);
    }
  };

  /**
   * Remove a given entity from a given table.
   *
   * Note: Modified from RECS.
   *
   * @param table {@link createTable BaseTable} to be updated.
   * @param entity {@link Entity} whose properties should be removed from this table.
   */
  const removeEntity = <PS extends Schema, M extends BaseTableMetadata = BaseTableMetadata, T = unknown>(
    table: BaseTable<PS, M, T>,
    entity: Entity,
    options: TableMutationOptions = {},
  ) => {
    const entitySymbol = getEntitySymbol(entity);
    const prevProperties = getEntityProperties(table, entity);

    for (const key of Object.keys(table.properties)) {
      table.properties[key].delete(entitySymbol);
    }

    if (!options.skipUpdateStream) {
      table.update$.next({
        entity,
        properties: { current: undefined, prev: prevProperties },
        table,
        type: prevProperties ? "exit" : "noop",
      });
    }
  };

  /**
   * Check whether a table contains properties for a given entity.
   *
   * Note: Modified from RECS.
   *
   * @param table {@link createTable Table} to check whether it has properties for the given entity.
   * @param entity {@link Entity} to check whether it has properties in the given table.
   * @returns true if the table contains properties for the given entity, else false.
   */
  const hasEntity = <PS extends Schema, M extends BaseTableMetadata = BaseTableMetadata, T = unknown>(
    table: BaseTable<PS, M, T>,
    entity: Entity,
  ): boolean => {
    const entitySymbol = getEntitySymbol(entity);
    const map = Object.values(table.properties)[0];
    return map.has(entitySymbol);
  };

  /**
   * Get the properties of a given entity in the given table.
   * Returns undefined if no properties or only partial properties are found.
   *
   * Note: Modified from RECS.
   *
   * @param table {@link createTable Table} to get the properties from for the given entity.
   * @param entity {@link Entity} to get the properties for from the given table.
   * @returns Properties of the given entity in the given table or undefined if no properties exists.
   */
  const getEntityProperties = <PS extends Schema, M extends BaseTableMetadata = BaseTableMetadata, T = unknown>(
    table: BaseTable<PS, M, T>,
    entity: Entity,
  ): Properties<PS, T> | undefined => {
    const properties: Record<string, unknown> = {};
    const entitySymbol = getEntitySymbol(entity);

    // Get the properties of each schema key
    const schemaKeys = Object.keys(table.propertiesSchema);
    for (const key of schemaKeys) {
      const val = table.properties[key].get(entitySymbol);
      if (val === undefined && !OptionalTypes.includes(table.propertiesSchema[key])) return undefined;
      properties[key] = val;
    }

    return properties as Properties<PS, T>;
  };

  /**
   * Get the properties of a given entity in the given table.
   * Throws an error if no properties exists for the given entity in the given table.
   *
   * Note: Modified from RECS.
   *
   * @param table {@link createTable Table} to get the properties from for the given entity.
   * @param entity {@link Entity} to get the properties for from the given table.
   * @returns Properties of the given entity in the given table.
   *
   * @remarks
   * Throws an error if no properties exists in the table for the given entity.
   */
  const getEntityPropertiesStrict = <PS extends Schema, M extends BaseTableMetadata = BaseTableMetadata, T = unknown>(
    table: BaseTable<PS, M, T>,
    entity: Entity,
  ): Properties<PS, T> => {
    const properties = getEntityProperties(table, entity);
    if (!properties) throw new Error(`No properties for table ${getTableName(table)} on entity ${entity}`);
    return properties;
  };

  /**
   * Compare two {@link Properties}s.
   * `a` can be partial table properties, in which case only the keys present in `a` are compared to the corresponding keys in `b`.
   *
   * Note: Modified from RECS.
   *
   * @param a Partial {@link Properties} to compare to `b`
   * @param b BaseTable properties to compare `a` to.
   * @returns True if `a` equals `b` in the keys present in a or neither `a` nor `b` are defined, else false.
   *
   * @example
   * ```
   * entityPropertiesEqual({ x: 1, y: 2 }, { x: 1, y: 3 }) // returns false because properties of y don't match
   * entityPropertiesEqual({ x: 1 }, { x: 1, y: 3 }) // returns true because x is equal and y is not present in a
   * ```
   */
  const entityPropertiesEqual = <S extends Schema, T = unknown>(
    a?: Partial<Properties<S, T>>,
    b?: Properties<S, T>,
  ): boolean => {
    if (!a && !b) return true;
    if (!a || !b) return false;

    let equals = true;
    for (const key of Object.keys(a)) {
      equals = isEqual(a[key], b[key]);
      if (!equals) return false;
    }

    return equals;
  };

  /**
   * Util to create a tuple of a table and properties with matching schema.
   * (Used to enforce Typescript type safety.)
   *
   * Note: Modified from RECS.
   *
   * @param table {@link createTable BaseTable} with {@link Schema} `S`
   * @param properties {@link Properties} with {@link Schema} `S`
   * @returns Tuple `[table, properties]`
   */
  const withProperties = <S extends Schema, T = unknown>(
    table: BaseTable<S, BaseTableMetadata, T>,
    properties: Properties<S, T>,
  ): [BaseTable<S, BaseTableMetadata, T>, Properties<S, T>] => {
    return [table, properties];
  };

  /**
   * Get a set of entities that have the given table properties in the given table.
   *
   * Note: Modified from RECS.
   *
   * @param table {@link createTable BaseTable} to get entities with the given properties from.
   * @param properties look for entities with these {@link Properties}.
   * @returns Set with {@link Entity Records} with the given table properties.
   */
  const getEntitiesWithProperties = <S extends Schema, T = unknown>(
    table: BaseTable<S, BaseTableMetadata, T> | IndexedBaseTable<S, BaseTableMetadata, T>,
    properties: Partial<Properties<S, T>>,
  ): Set<Entity> => {
    // Shortcut for indexers
    if (isIndexed(table) && isFullTableProperties(table, properties)) {
      return table.getEntitiesWithProperties(properties);
    }

    // Trivial implementation for regular tables
    const entities = new Set<Entity>();
    for (const entity of getTableEntities(table)) {
      const recProperties = getEntityProperties(table, entity);
      if (entityPropertiesEqual(properties, recProperties)) {
        entities.add(entity);
      }
    }

    return entities;
  };

  /**
   * Get a set of all entities of the given table.
   *
   * Note: Modified from RECS.
   *
   * @param table {@link createTable BaseTable} to get all entities from
   * @returns Set of all entities in the given table.
   */
  const getTableEntities = <S extends Schema, T = unknown>(
    table: BaseTable<S, BaseTableMetadata, T>,
  ): IterableIterator<Entity> => {
    return table.entities();
  };

  /**
   * Helper function to create a table update for the current table properties of a given entity.
   *
   * Note: Modified from RECS.
   *
   * @param entities Entity to create the component update for.
   * @param table BaseTable to create the table update for.
   * @returns TableUpdate {@link TableUpdate} corresponding to the given entity, the given table and the entity's current properties.
   */
  const toUpdate = <S extends Schema>(entity: Entity, table: BaseTable<S>): TableUpdate<S> => {
    const properties = getEntityProperties(table, entity);

    return {
      entity,
      table,
      properties: { current: properties, prev: undefined },
      type: properties ? "enter" : "noop",
    };
  };

  /**
   * Helper function to turn a stream of {@link Entity Entities} into a stream of table updates of the given table.
   *
   * Note: Modified from RECS.
   *
   * @param table BaseTable to create update stream for.
   * @returns Unary function to be used with RxJS that turns stream of {@link Entity Entities} into stream of table updates.
   */
  const toUpdateStream = <S extends Schema>(table: BaseTable<S>) => {
    return pipe(map((entity: Entity) => toUpdate(entity, table)));
  };

  /**
   * Helper function to check whether a given table is indexed.
   *
   * Note: Modified from RECS.
   *
   * @param c
   * @returns Whether the given table is indexed.
   */
  const isIndexed = <S extends Schema>(table: BaseTable<S> | IndexedBaseTable<S>): table is IndexedBaseTable<S> => {
    return "getEntitiesWithProperties" in table;
  };

  /**
   * Helper function to check whether given table properties are partial or full.
   *
   * Note: Modified from RECS.
   *
   * @param table
   * @param properties
   * @returns Whether the given table properties are full.
   */
  const isFullTableProperties = <S extends Schema, T = unknown>(
    table: BaseTable<S, BaseTableMetadata, T>,
    properties: Partial<Properties<S, T>>,
  ): properties is Properties<S, T> => {
    return Object.keys(table.propertiesSchema).every((key) => key in properties);
  };

  /**
   * Type guard to infer the TypeScript type of a given table update
   *
   * @param update Table update to infer the type of.
   * @param table {@link createTable BaseTable} to check whether the given update corresponds to it.
   * @returns True (+ infered type for `update`) if `update` belongs to `table`. Else false.
   */
  const isTableUpdate = <S extends Schema, T = unknown>(
    update: TableUpdate<S, BaseTableMetadata, T>,
    table: BaseTable<S, BaseTableMetadata, T>,
  ): update is TableUpdate<S, BaseTableMetadata, T> => {
    return update.table.id === table.id;
  };

  return {
    setEntity,
    updateEntity,
    removeEntity,
    hasEntity,
    getEntityProperties,
    getEntityPropertiesStrict,
    entityPropertiesEqual,
    withProperties,
    getEntitiesWithProperties,
    getTableEntities,
    toUpdate,
    toUpdateStream,
    isIndexed,
    isFullTableProperties,
    isTableUpdate,
  };
};
