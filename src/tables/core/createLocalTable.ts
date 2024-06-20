import { createTable, type TableOptions } from "@/tables/core/createTable";
import type { Table } from "@/tables/types";
import type { World } from "@/lib/external/mud/world";
import {
  type BaseTableMetadata,
  OptionalSchema,
  type Properties,
  type Schema,
  Type,
  toOptionalType,
} from "@/lib/external/mud/schema";
import { uuid } from "@/lib/external/uuid";

/**
 * Creates a local table with the specified properties schema, options and metadata.
 *
 * These tables are meant to be created directly during implementation, then used alongside contract tables
 * with the exact same API.
 *
 * @param world The MUD world object.
 * @param propertiesSchema The schema of the table properties, defining their RECS types.
 * @param options (optional) The options for creating the table (see {@link TableOptions}).
 * @returns A local table object with the specified properties, and fully typed methods for data manipulation.
 * @example
 * This example creates a local table with a single property, "darkMode".
 *
 * ```ts
 * const darkModeTable = createLocalTable(world, { darkMode: Type.Boolean }, { id: "DarkMode" });
 * // or more simply
 * const darkModeTable = createLocalBoolTable(world, { id: "DarkMode" });
 * darkModeTable.set({ value: true });
 * console.log(darkModeTable.get());
 * // -> { value: true }
 * ```
 *
 * @example
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
  defaultProperties?: Properties<PS, T>,
) => {
  const { id, metadata: baseMetadata, persist } = options ?? { id: uuid(), persist: false };

  const metadata = {
    ...baseMetadata,
    name: id,
    namespace: baseMetadata?.namespace ?? ("local" as const),
    globalName:
      baseMetadata?.globalName ?? baseMetadata?.namespace
        ? (`${baseMetadata.namespace}__${id}` as const)
        : (`local__${id}` as const),
    abiKeySchema: { entity: "bytes32" } as const,
  } as const satisfies BaseTableMetadata;

  // For persistent tables, we want schema types to be optional
  const adjustedPropertiesSchema = persist
    ? ({
        ...Object.fromEntries(Object.entries(propertiesSchema).map(([key, type]) => [key, toOptionalType(type)])),
      } as OptionalSchema<PS>)
    : propertiesSchema;

  const table = createTable(world, adjustedPropertiesSchema, {
    ...options,
    id,
    metadata,
  }) as unknown as Table<typeof adjustedPropertiesSchema, typeof metadata, T>;

  if (defaultProperties) {
    const currentProperties = table.get();
    // If currentProperties are undefined, we just set the default properties
    // If only some of the values are undefined (after a schema change), only set the default value for those
    const properties = Object.entries(defaultProperties).reduce(
      (acc, [key, value]) => {
        acc[key as keyof PS] = currentProperties?.[key] ?? value;
        return acc;
      },
      {} as Properties<PS, T>,
    );

    // defaultProperties DON'T get written to local storage, as they are only a placeholder for new entities;
    // if changing defaultProperties, you'd expect uninitialized entities to get the new default value, not retrieve the old one as a definitive value
    table.set(properties, undefined, { persist: false });
  }

  return table;
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
  defaultProperties?: Properties<{ value: Type.Number }>,
) => {
  return createLocalTable(world, { value: Type.Number }, options, defaultProperties);
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
  defaultProperties?: Properties<{ value: Type.BigInt }>,
) => {
  return createLocalTable(world, { value: Type.BigInt }, options, defaultProperties);
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
  defaultProperties?: Properties<{ value: Type.String }>,
) => {
  return createLocalTable(world, { value: Type.String }, options, defaultProperties);
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
  defaultProperties?: Properties<{ x: Type.Number; y: Type.Number }>,
) => {
  return createLocalTable(world, { x: Type.Number, y: Type.Number }, options, defaultProperties);
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
  defaultProperties?: Properties<{ value: Type.Boolean }>,
) => {
  return createLocalTable(world, { value: Type.Boolean }, options, defaultProperties);
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
  defaultProperties?: Properties<{ value: Type.Entity }>,
) => {
  return createLocalTable(world, { value: Type.Entity }, options, defaultProperties);
};
