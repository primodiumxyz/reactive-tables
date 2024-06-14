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
type Serializable = Serialized | Array<Serialized>;
type Serialized = string | number | boolean;
type StoredTable<PS extends Schema> = { [key in keyof PS]: { [entity: Entity]: Serialized } };

/* -------------------------------------------------------------------------- */
/*                                   STORAGE                                  */
/* -------------------------------------------------------------------------- */

const LOCAL_STORAGE_KEY = "RETA";
const PREFIX = `${LOCAL_STORAGE_KEY}_tables_`;
const getStorageKey = (tableId: string) => `${PREFIX}${tableId}`;

const getStoredTable = <PS extends Schema>(tableId: string) => {
  const storageKey = getStorageKey(tableId);
  const storedTable = localStorage.getItem(storageKey);

  return { storedTable: storedTable ? (JSON.parse(storedTable) as StoredTable<PS>) : undefined, storageKey };
};

const setStoredTable = <PS extends Schema, T>(
  table: BaseTable<PS, BaseTableMetadata, T>,
  storedTable: StoredTable<PS>,
  storageKey?: string,
): void => {
  localStorage.setItem(storageKey ?? getStorageKey(table.id), JSON.stringify(storedTable));
};

/* -------------------------------------------------------------------------- */
/*                                   METHODS                                  */
/* -------------------------------------------------------------------------- */

// Get properties for an entity inside a stored table.
const getProperties = <PS extends Schema, M extends BaseTableMetadata, T>(
  table: BaseTable<PS, M, T>,
  propertiesSchema: PS,
  entity: Entity,
): Properties<PS, T> | undefined => {
  const { storedTable } = getStoredTable<PS>(table.id);
  if (!storedTable) return undefined;

  const properties = Object.keys(propertiesSchema).reduce(
    (acc, key) => {
      const entityValue = storedTable[key as keyof PS][entity];
      const decodedEntityValue = decodeValue<PS, T>(propertiesSchema, key, entityValue);
      acc[key as keyof PS] = decodedEntityValue;
      return acc;
    },
    {} as Properties<PS, T>,
  );

  return Object.keys(properties).length ? properties : undefined;
};

// Set properties for an entity inside a table.
const setProperties = <PS extends Schema, M extends BaseTableMetadata, T>(
  table: BaseTable<PS, M, T>,
  properties: Properties<PS, T>,
  entity: Entity,
): void => {
  const { storedTable: _storedTable, storageKey } = getStoredTable<PS>(table.id);
  const storedTable = _storedTable ?? ({} as StoredTable<PS>);

  const updatedStoredTable = Object.keys(properties).reduce(
    (acc, key) => {
      const encodedValue = encodeValue(table.propertiesSchema[key], properties[key]);
      acc[key as keyof PS] = { ...storedTable[key as keyof PS], [entity]: encodedValue };
      return acc;
    },
    { ...storedTable } as StoredTable<PS>,
  );

  setStoredTable(table, updatedStoredTable, storageKey);
};

// Update some properties for an entity inside a table.
const updateProperties = <PS extends Schema, M extends BaseTableMetadata, T>(
  table: BaseTable<PS, M, T>,
  properties: Partial<Properties<PS, T>>,
  entity: Entity,
): void => {
  const { storedTable, storageKey } = getStoredTable<PS>(table.id);
  if (!storedTable) throw new Error(`Table "${table.id}" not found in local storage`);

  const updatedStoredTable = Object.keys(storedTable).reduce(
    (acc, key) => {
      const value = properties[key as keyof PS];
      const encodedValue = value
        ? encodeValue(table.propertiesSchema[key], properties[key] as Primitive)
        : storedTable[key as keyof PS][entity];
      acc[key as keyof PS] = { ...storedTable[key as keyof PS], [entity]: encodedValue };
      return acc;
    },
    { ...storedTable } as StoredTable<PS>,
  );

  setStoredTable(table, updatedStoredTable, storageKey);
};

// Get all properties for all entities inside a table.
const getAllProperties = <PS extends Schema, M extends BaseTableMetadata, T = unknown>(
  tableId: string,
  propertiesSchema: PS,
): BaseTable<PS, M, T>["properties"] | undefined => {
  const { storedTable } = getStoredTable<PS>(tableId);
  if (!storedTable) return undefined;

  return Object.keys(propertiesSchema).reduce(
    (acc, key) => {
      const properties = new Map<EntitySymbol, MappedType<T>[PS[keyof PS]]>();

      Object.entries(storedTable[key as keyof PS]).forEach(([entity, value]) => {
        const decodedValue = decodeValue<PS, T>(propertiesSchema, key, value);
        properties.set(getEntitySymbol(entity as Entity), decodedValue);
      });

      acc[key as keyof PS] = properties;
      return acc;
    },
    {} as BaseTable<PS, M, T>["properties"],
  );
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
  getProperties,
  setProperties,
  updateProperties,
};
