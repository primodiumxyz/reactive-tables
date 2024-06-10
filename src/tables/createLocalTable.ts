import { createTable, type BaseTableMetadata, type Table, type TableOptions } from "@/tables";
import { Type, uuid, type Schema, type World } from "@/lib";

/**
 * Creates a local table with the specified properties schema, options and default properties.
 *
 * These tables are meant to be created directly during implementation, then used alongside contract tables
 * the exact same way.
 *
 * @param world The MUD world object.
 * @param propertiesSchema The schema of the table properties, defining their RECS types.
 * @param options (optional) The options for creating the table (see {@link CreateLocalTableOptions}).
 * if the table is persistent and already has properties from a previous session
 * @returns A local table object with the specified properties, and fully typed methods for data manipulation.
 * @example
 * This example creates a local table with a single property, "darkMode", set to false.
 *
 * ```ts
 * const darkModeTable = createLocalTable(world, { darkMode: Type.Boolean }, { id: "DarkMode" }, { darkMode: false });
 * console.log(darkModeTable.get());
 * // -> { darkMode: false }
 *
 * // or more simply
 * const darkModeTable = createLocalBoolTable(world, { id: "DarkMode" }, { value: false });
 * console.log(darkModeTable.get());
 * // -> { value: false }
 * ```
 *
 * @example @todo persistence
 * This example creates a persistent local table with coordinates properties.
 *
 * ```ts
 * // This table will be persisted in local storage, and loaded with its latest properties next time.
 * const coordsTable = createLocalCoordTable(world, { id: "Coords", persist: true }, { x: 0, y: 0 });
 * ```
 * @category Creation
 */
export const createLocalTable = <PS extends Schema, M extends BaseTableMetadata, T = unknown>(
  world: World,
  propertiesSchema: PS,
  options?: TableOptions<M>,
  // defaultProperties?: Properties<PS, T>, // TODO: persistence
) => {
  const { id, metadata: baseMetadata } = options ?? { id: uuid() };

  const metadata = {
    ...baseMetadata,
    name: id,
    namespace: baseMetadata?.namespace ?? ("local" as const),
    globalName:
      baseMetadata?.globalName ?? baseMetadata?.namespace ? `${baseMetadata.namespace}__${id}` : `local__${id}`,
    abiKeySchema: { entity: "bytes32" } as const,
  } as const satisfies BaseTableMetadata;

  return createTable(world, propertiesSchema, { ...options, id, metadata }) as unknown as Table<PS, typeof metadata, T>;
};

/**
 * Defines a local table with a single number property.
 */
export type LocalNumberTable = ReturnType<typeof createLocalNumberTable>;
/**
 * Creates a local table with the specified properties schema, options and default properties.
 *
 * This is a shorthand for creating a local table with a single number property.
 * @see {@link createLocalTable}
 */
export const createLocalNumberTable = <M extends BaseTableMetadata>(
  world: World,
  options?: TableOptions<M>,
  // defaultProperties?: Properties<{ value: Type.Number }>,
) => {
  return createLocalTable(world, { value: Type.Number }, options);
};

/**
 * Defines a local table with a single BigInt property.
 */
export type LocalBigIntTable = ReturnType<typeof createLocalBigIntTable>;
/**
 * Creates a local table with the specified properties schema, options and default properties.
 *
 * This is a shorthand for creating a local table with a single BigInt property.
 * @see {@link createLocalTable}
 */
export const createLocalBigIntTable = <M extends BaseTableMetadata>(
  world: World,
  options?: TableOptions<M>,
  // defaultProperties?: Properties<{ value: Type.BigInt }>,
) => {
  return createLocalTable(world, { value: Type.BigInt }, options);
};

/**
 * Defines a local table with a single string property.
 */
export type LocalStringTable = ReturnType<typeof createLocalStringTable>;
/**
 * Creates a local table with the specified properties schema, options and default properties.
 *
 * This is a shorthand for creating a local table with a single string property.
 * @see {@link createLocalTable}
 */
export const createLocalStringTable = <M extends BaseTableMetadata>(
  world: World,
  options?: TableOptions<M>,
  // defaultProperties?: Properties<{ value: Type.String }>,
) => {
  return createLocalTable(world, { value: Type.String }, options);
};

/**
 * Defines a local table with number properties for coordinates, specifically `x` and `y`.
 */
export type LocalCoordTable = ReturnType<typeof createLocalCoordTable>;
/**
 * Creates a local table with the specified properties schema, options and default properties.
 *
 * This is a shorthand for creating a local table with number properties for coordinates, specifically `x` and `y`.
 * @see {@link createLocalTable}
 */
export const createLocalCoordTable = <M extends BaseTableMetadata>(
  world: World,
  options?: TableOptions<M>,
  // defaultProperties?: Properties<{ x: Type.Number; y: Type.Number }>,
) => {
  return createLocalTable(world, { x: Type.Number, y: Type.Number }, options);
};

/**
 * Defines a local table with a single boolean property.
 */
export type LocalBoolTable = ReturnType<typeof createLocalBoolTable>;
/**
 * Creates a local table with the specified properties schema, options and default properties.
 *
 * This is a shorthand for creating a local table with a single boolean property.
 * @see {@link createLocalTable}
 */
export const createLocalBoolTable = <M extends BaseTableMetadata>(
  world: World,
  options?: TableOptions<M>,
  // defaultProperties?: Properties<{ value: Type.Boolean }>,
) => {
  return createLocalTable(world, { value: Type.Boolean }, options);
};

/**
 * Defines a local table with a single entity property.
 */
export type LocalEntityTable = ReturnType<typeof createLocalEntityTable>;
/**
 * Creates a local table with the specified properties schema, options and default properties.
 *
 * This is a shorthand for creating a local table with a single entity property.
 * @see {@link createLocalTable}
 */
export const createLocalEntityTable = <M extends BaseTableMetadata>(
  world: World,
  options?: TableOptions<M>,
  // defaultProperties?: Properties<{ value: Type.Entity }>,
) => {
  return createLocalTable(world, { value: Type.Entity }, options);
};
