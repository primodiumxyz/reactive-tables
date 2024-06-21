import type { BaseTable, TableBaseMethods, TableWithKeysMethods } from "@/tables/types";
import { defaultEntity, type Entity } from "@/lib/external/mud/entity";
import { decodeEntity, encodeEntity } from "@/lib/external/mud/schema";
import type { BaseTableMetadata, Keys, Properties, PropertiesSansMetadata, Schema } from "@/lib/external/mud/schema";

/**
 * Create a set of methods to interact with a table using values for its keys properties,
 * that get encoded into a Entity.
 *
 * Note: See {@link TableWithKeyMethods} for more information about each method.
 *
 * @param table The BaseTable object.
 * @param methods The original table methods (see {@link TableMethods}).
 * @returns The key-specific table methods (see {@link TableWithKeyMethods}).
 * @category Table
 */
export const createTableKeyMethods = <PS extends Schema, M extends BaseTableMetadata, T = unknown>({
  table,
  ...methods
}: TableBaseMethods<PS, M, T> & {
  table: BaseTable<PS, M, T>;
}): TableWithKeysMethods<PS, M, T> => {
  const {
    metadata: { abiKeySchema },
  } = table;
  const { get, has, use, set } = methods;

  // Get the properties of an entity using its keys
  function getWithKeys(): Properties<PS, T> | undefined;
  function getWithKeys(keys?: Keys<M["abiKeySchema"], T>): Properties<PS, T> | undefined;
  function getWithKeys(
    keys?: Keys<M["abiKeySchema"], T>,
    defaultProperties?: PropertiesSansMetadata<PS, T>,
  ): Properties<PS, T>;
  function getWithKeys(keys?: Keys<M["abiKeySchema"], T>, defaultProperties?: PropertiesSansMetadata<PS, T>) {
    const entity = keys && abiKeySchema ? encodeEntity(abiKeySchema, keys) : defaultEntity;
    return get(entity, defaultProperties);
  }

  // Check if an entity exists inside the table using its keys
  const hasWithKeys = (keys?: Keys<M["abiKeySchema"], T>) => {
    const entity = keys && abiKeySchema ? encodeEntity(abiKeySchema, keys) : defaultEntity;
    return has(entity);
  };

  // Use (hook) the properties of an entity using its keys
  const useWithKeys = (keys?: Keys<M["abiKeySchema"], T>, defaultProperties?: PropertiesSansMetadata<PS, T>) => {
    const entity = keys && abiKeySchema ? encodeEntity(abiKeySchema, keys) : defaultEntity;
    return use(entity, defaultProperties);
  };

  // Set the properties of an entity using its keys
  const setWithKeys = (properties: Properties<PS, T>, keys: Keys<M["abiKeySchema"], T>) => {
    const entity = keys && abiKeySchema ? encodeEntity(abiKeySchema, keys) : defaultEntity;
    return set(properties, entity);
  };

  // Get the keys properties of an entity using its entity
  const getEntityKeys = (entity: Entity) => {
    return (abiKeySchema ? decodeEntity(abiKeySchema, entity) : {}) as unknown as Keys<M["abiKeySchema"], T>;
  };

  return {
    getWithKeys,
    hasWithKeys,
    // Don't expose useWithKeys in a non-browser environment
    useWithKeys:
      typeof window !== "undefined"
        ? useWithKeys
        : () => {
            throw new Error("The method useWithKeys is only available in the browser");
          },
    setWithKeys,
    getEntityKeys,
  };
};
