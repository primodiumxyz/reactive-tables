import type { BaseTable } from "@/tables/types";
import { getEntitySymbol, type Entity, type EntitySymbol } from "@/lib/external/mud/entity";
import type { MappedType, Primitive, BaseTableMetadata, Properties, Schema } from "@/lib/external/mud/schema";
import { Type } from "@/lib/external/mud/schema";

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

/**
 * {
 *   "RETA_tables_0x0000...127": {
 *     x: {
 *       "0xabc...def": 10,
 *       "0x123...456": 5
 *     },
 *     y: {
 *       "0xabc...def": 20,
 *       "0x123...456": 15
 *     },
 *     ...
 *   },
 *   "RETA_tables_Score": {
 *     ...
 *   },
 * }
 */
type Serialized = string | number | boolean | undefined;
type Serializable = Serialized | Array<Serialized>;
type StoredTable<PS extends Schema> = { [key in keyof PS]: { [entity: Entity]: Serializable; ["type"]: Type } };
type TableProperties<PS extends Schema, M extends BaseTableMetadata, T = unknown> = BaseTable<PS, M, T>["properties"];

/* -------------------------------------------------------------------------- */
/*                                   STORAGE                                  */
/* -------------------------------------------------------------------------- */

export const DEFAULT_VERSION = "0.0.0";

const LOCAL_STORAGE_KEY = "RETA";
const TABLES_PREFIX = `${LOCAL_STORAGE_KEY}_tables_`;
const getStorageKey = (tableId: string, version?: string) => `${TABLES_PREFIX}${tableId}_${version ?? DEFAULT_VERSION}`;

// Get all properties stored for a table at a specific version
const getStoredTable = <PS extends Schema>(tableId: string, version?: string) => {
  const storageKey = getStorageKey(tableId, version);
  const storedTable = localStorage.getItem(storageKey);

  return { storedTable: storedTable ? (JSON.parse(storedTable) as StoredTable<PS>) : undefined, storageKey };
};

// Store the properties for a table at a specific version
const setStoredTable = <PS extends Schema>(
  tableId: string,
  storedTable: StoredTable<PS>,
  version?: string,
  storageKey?: string,
): void => {
  localStorage.setItem(storageKey ?? getStorageKey(tableId, version), JSON.stringify(storedTable));
};

/* -------------------------------------------------------------------------- */
/*                                   METHODS                                  */
/* -------------------------------------------------------------------------- */

// Get all properties for all entities inside a table.
const getAllProperties = <PS extends Schema, M extends BaseTableMetadata, T = unknown>(
  tableId: string,
  propertiesSchema: PS,
  version?: string,
): TableProperties<PS, M, T> | undefined => {
  const { storedTable } = getStoredTable<PS>(tableId, version);
  if (!storedTable) return undefined;

  const changedKeys: (keyof PS)[] = [];

  const allProperties = Object.keys(propertiesSchema).reduce(
    (acc, key) => {
      const properties = new Map<EntitySymbol, MappedType<T>[PS[keyof PS]]>();
      const storedProperties = storedTable[key as keyof PS];

      if (storedProperties) {
        Object.entries(storedProperties).forEach(([entity, value]) => {
          const decodedValue = decodeValue<PS, T>(propertiesSchema, key, value);
          const type = storedProperties["type"];
          if (type === propertiesSchema[key]) {
            properties.set(getEntitySymbol(entity as Entity), decodedValue);
            // if the type of the stored property is different from the schema (new/removed key, same name but different type)
          } else {
            changedKeys.push(key as keyof PS);
          }
        });
      }

      acc[key as keyof PS] = properties;
      return acc;
    },
    {} as TableProperties<PS, M, T>,
  );

  if (changedKeys.length > 0) {
    console.warn(
      `Table "${tableId}" has schema changes for keys: ${changedKeys.join(", ")}. Properties state might be incomplete, as values for these keys will be undefined.`,
    );
  }

  return allProperties;
};

// Set properties for an entity inside a table.
const setProperties = <PS extends Schema, M extends BaseTableMetadata, T>(
  table: BaseTable<PS, M, T>,
  properties: Properties<PS, T>,
  entity: Entity,
  version?: string,
): void => {
  const { storedTable, storageKey } = getStoredTable<PS>(table.id, version);
  console.log(table.metadata.name, properties);

  const updatedStoredTable = Object.keys(properties).reduce(
    (acc, _key) => {
      const key = _key as keyof PS;
      const type = table.propertiesSchema[key];
      const encodedValue = encodeValue(type, properties[key]);

      acc[key] = storedTable
        ? { ...storedTable[key], [entity]: encodedValue }
        : { [entity]: encodedValue, ["type"]: table.propertiesSchema[key] };
      return acc;
    },
    { ...storedTable } as StoredTable<PS>,
  );

  setStoredTable(table.id, updatedStoredTable, version, storageKey);
};

// Update some properties for an entity inside a table.
const updateProperties = <PS extends Schema, M extends BaseTableMetadata, T>(
  table: BaseTable<PS, M, T>,
  properties: Partial<Properties<PS, T>>,
  entity: Entity,
  version?: string,
): void => {
  const { storedTable, storageKey } = getStoredTable<PS>(table.id, version);
  if (!storedTable) throw new Error(`Table "${table.id}" not found in local storage`);

  // We can safely used `storedTable` keys as we're not supposed to update properties that were never set
  const updatedStoredTable = Object.keys(storedTable).reduce(
    (acc, _key) => {
      const key = _key as keyof PS;
      const type = table.propertiesSchema[key];
      const encodedValue = properties[key] ? encodeValue(type, properties[key]) : storedTable[key][entity];

      acc[key] = { ...storedTable[key], [entity]: encodedValue };
      return acc;
    },
    { ...storedTable } as StoredTable<PS>,
  );

  setStoredTable(table.id, updatedStoredTable, version, storageKey);
};

/* -------------------------------------------------------------------------- */
/*                                    UTILS                                   */
/* -------------------------------------------------------------------------- */

const isBigIntType = (type: Type) => type === Type.BigInt || type === Type.OptionalBigInt;
const isBigIntArrayType = (type: Type) => type === Type.BigIntArray || type === Type.OptionalBigIntArray;

const decodeValue = <PS extends Schema = Schema, T = unknown>(
  propertiesSchema: PS,
  key: keyof PS,
  value: Serializable,
): Properties<PS, T>[keyof PS] =>
  (isBigIntType(propertiesSchema[key])
    ? BigInt(value as string)
    : isBigIntArrayType(propertiesSchema[key])
      ? (value as Array<string>).map(BigInt)
      : value) as Properties<PS, T>[typeof key];

const encodeValue = (type: Type, value: Primitive): Serializable | undefined => {
  if (!value) return undefined;
  if (isBigIntType(type)) return value.toString();
  if (isBigIntArrayType(type)) return (value as Array<bigint>).map((v) => v.toString());
  return value as Serializable;
};

/* -------------------------------------------------------------------------- */
/*                                   EXPORTS                                  */
/* -------------------------------------------------------------------------- */

export const LocalStorage = {
  getAllProperties,
  setProperties,
  updateProperties,
};
