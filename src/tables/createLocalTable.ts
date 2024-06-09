import { BaseTableMetadata, Table, TableOptions, createTable } from "@/tables";
import { type Schema, Type, uuid, World } from "@/lib";

/**
 * Creates a local table with the specified schema, options and default properties.
 *
 * These tables are meant to be created directly during implementation, then used alongside contract tables
 * the exact same way.
 *
 * @param world The MUD world object.
 * @param schema The schema of the table properties, defining their RECS types.
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
export const createLocalTable = <S extends Schema, M extends BaseTableMetadata, T = unknown>(
  world: World,
  schema: S,
  options?: TableOptions<M>,
  // defaultProperties?: Properties<S, T>, // TODO: persistence
): Table<S, M, T> => {
  const { id, metadata: baseMetadata } = options ?? { id: uuid() };

  const metadata = {
    ...baseMetadata,
    name: id,
    namespace: baseMetadata?.namespace ?? ("local" as const),
    globalName:
      baseMetadata?.globalName ?? baseMetadata?.namespace ? `${baseMetadata.namespace}__${id}` : `local__${id}`,
    abiKeySchema: { $record: "bytes32" },
  } as const satisfies BaseTableMetadata;

  return createTable(world, schema, { ...options, id, metadata });
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
 * Creates a local table with the specified schema, options and default properties.
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
 * Creates a local table with the specified schema, options and default properties.
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
 * Creates a local table with the specified schema, options and default properties.
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
 * Creates a local table with the specified schema, options and default properties.
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
 * Defines a local table with a single record property.
 */
export type Local$RecordTable = ReturnType<typeof createLocal$RecordTable>;
/**
 * Creates a local table with the specified schema, options and default properties.
 *
 * This is a shorthand for creating a local table with a single record property.
 * @see {@link createLocalTable}
 */
export const createLocal$RecordTable = <M extends BaseTableMetadata>(
  world: World,
  options?: TableOptions<M>,
  // defaultProperties?: Properties<{ value: Type.$Record }>,
) => {
  return createLocalTable(world, { value: Type.$Record }, options);
};
