import { keccak256, toHex } from "viem";

import { createTableMethods, Properties } from "@/tables";
import { LocalTable, LocalTableMetadata } from "@/tables/local";
import { Metadata, Schema, Store, Type, uuid } from "@/lib";

/**
 * Defines the options for creating a local table.
 *
 * @template M The type of any provided metadata for the table.
 * @param id The unique identifier for the table, usually—but not necessarily— a human-readable and descriptive name.
 * @param metadata (optional) Any additional metadata to be associated with the table.
 * @param persist (optional) Whether the table should be persisted in local storage or not. Default: false.
 */
export type CreateLocalTableOptions<M extends Metadata> = {
  id: string; // default: uuid
  metadata?: M;
  persist?: boolean;
};

/**
 * Creates a local table with the specified schema, options and default properties.
 *
 * These tables are meant to be created directly during implementation, then used alongside contract tables
 * the exact same way. The only difference is that they won't take any key for accessing various records, as
 * they are designed as a single record table.
 *
 * Note: when creating a persistent table, on the browser, you MUST wait for the sync with local storage to be started;
 * otherwise, there will be inconsistencies with properties from the last and current sessions.
 *
 * @param store The store accessor returned by the wrapper, containing both the persistent and regular stores.
 * @param schema The schema of the table, defining the properties and their types.
 * @param options (optional) The options for creating the table (see {@link CreateLocalTableOptions}).
 * @param defaultProperties (optional) The default properties to set for the table on initialization; will be overridden
 * if the table is persistent and already has properties from a previous session
 * @returns A local table object with the specified properties, and fully typed methods for data manipulation.
 * @example
 * This example creates a local table with a single property, "darkMode", set to false.
 *
 * ```ts
 * const darkModeTable = createLocalTable(store, { darkMode: PropType.Boolean }, { id: "DarkMode" }, { darkMode: false });
 * console.log(darkModeTable.get());
 * // -> { darkMode: false }
 *
 * // or more simply
 * const darkModeTable = createLocalBoolTable(store, { id: "DarkMode" }, { value: false });
 * console.log(darkModeTable.get());
 * // -> { value: false }
 * ```
 *
 * @example
 * This example creates a persistent local table with coordinates properties.
 *
 * ```ts
 * // Wait for the sync with local storage to be started after creating the wrapper
 * const { store } = createWrapper({ mudConfig });
 * await store("PERSIST").ready();
 *
 * // This table will be persisted in local storage, and loaded with its latest properties next time.
 * const coordsTable = createLocalCoordTable(store, { id: "Coords", persist: true }, { x: 0, y: 0 });
 * ```
 * @category Creation
 */
export const createLocalTable = <S extends Schema, M extends Metadata, T = unknown>(
  store: Store,
  schema: S,
  options?: CreateLocalTableOptions<M>,
  defaultProperties?: Properties<S, T>,
): LocalTable<S, M, LocalTableMetadata<S, M>, T> => {
  const { id } = options ?? { id: uuid() };
  // Get the appropriate store instance
  const storeInstance = options?.persist ? store("PERSIST") : store();

  // Format metadata the same way as MUD tables to treat it the same way during methods creation
  const metadata = {
    tableId: keccak256(toHex(id)),
    namespace: "internal" as const,
    name: id,
    schema,
  } as LocalTableMetadata<S, M>;

  const table = {
    // Table data
    id: metadata.tableId,
    schema,
    metadata: {
      ...options?.metadata,
      name: id,
      globalName: `internal__${id}`,
    },
    // Methods
    ...createTableMethods({ store: storeInstance, queries: storeInstance.getQueries(), metadata }),
  } as unknown as LocalTable<S, M, typeof metadata, T>;

  // If some default properties are provided
  if (defaultProperties) {
    // and the table is persistent, check if the properties were already stored last time
    const properties = options?.persist ? table.get() : undefined;
    // If not, or if the table is not persistent, set the default properties
    if (properties === undefined) {
      table.set(defaultProperties);
    }
  }

  return table;
};

/**
 * Defines a local table with a single number property.
 */
export type LocalNumberTable = ReturnType<typeof createLocalNumberTable>;
/**
 * Creates a local table with the specified schema, options and default properties.
 *
 * This is a shorthand for creating a local table with a single number property.
 * @see {@link createLocalTable}
 */
export const createLocalNumberTable = <M extends Metadata>(
  store: Store,
  options?: CreateLocalTableOptions<M>,
  defaultProperties?: Properties<{ value: Type.Number }>,
) => {
  return createLocalTable(store, { value: Type.Number }, options, defaultProperties);
};

/**
 * Defines a local table with a single BigInt property.
 */
export type LocalBigIntTable = ReturnType<typeof createLocalBigIntTable>;
/**
 * Creates a local table with the specified schema, options and default properties.
 *
 * This is a shorthand for creating a local table with a single BigInt property.
 * @see {@link createLocalTable}
 */
export const createLocalBigIntTable = <M extends Metadata>(
  store: Store,
  options?: CreateLocalTableOptions<M>,
  defaultProperties?: Properties<{ value: Type.BigInt }>,
) => {
  return createLocalTable(store, { value: Type.BigInt }, options, defaultProperties);
};

/**
 * Defines a local table with a single string property.
 */
export type LocalStringTable = ReturnType<typeof createLocalStringTable>;
/**
 * Creates a local table with the specified schema, options and default properties.
 *
 * This is a shorthand for creating a local table with a single string property.
 * @see {@link createLocalTable}
 */
export const createLocalStringTable = <M extends Metadata>(
  store: Store,
  options?: CreateLocalTableOptions<M>,
  defaultProperties?: Properties<{ value: Type.String }>,
) => {
  return createLocalTable(store, { value: Type.String }, options, defaultProperties);
};

/**
 * Defines a local table with number properties for coordinates, specifically `x` and `y`.
 */
export type LocalCoordTable = ReturnType<typeof createLocalCoordTable>;
/**
 * Creates a local table with the specified schema, options and default properties.
 *
 * This is a shorthand for creating a local table with number properties for coordinates, specifically `x` and `y`.
 * @see {@link createLocalTable}
 */
export const createLocalCoordTable = <M extends Metadata>(
  store: Store,
  options?: CreateLocalTableOptions<M>,
  defaultProperties?: Properties<{ x: Type.Number; y: Type.Number }>,
) => {
  return createLocalTable(store, { x: Type.Number, y: Type.Number }, options, defaultProperties);
};

/**
 * Defines a local table with a single boolean property.
 */
export type LocalBoolTable = ReturnType<typeof createLocalBoolTable>;
/**
 * Creates a local table with the specified schema, options and default properties.
 *
 * This is a shorthand for creating a local table with a single boolean property.
 * @see {@link createLocalTable}
 */
export const createLocalBoolTable = <M extends Metadata>(
  store: Store,
  options?: CreateLocalTableOptions<M>,
  defaultProperties?: Properties<{ value: Type.Boolean }>,
) => {
  return createLocalTable(store, { value: Type.Boolean }, options, defaultProperties);
};

/**
 * Defines a local table with a single record property.
 */
export type Local$RecordTable = ReturnType<typeof createLocal$RecordTable>;
/**
 * Creates a local table with the specified schema, options and default properties.
 *
 * This is a shorthand for creating a local table with a single record property.
 * @see {@link createLocalTable}
 */
export const createLocal$RecordTable = <M extends Metadata>(
  store: Store,
  options?: CreateLocalTableOptions<M>,
  defaultProperties?: Properties<{ value: Type.$Record }>,
) => {
  return createLocalTable(store, { value: Type.$Record }, options, defaultProperties);
};
