import { Subject } from "rxjs";

import { createTableMethods, type BaseTableMetadata, type Table, type BaseTable } from "@/tables";
import {
  createIndexer,
  getEntityHex,
  mapObject,
  transformIterator,
  uuid,
  type Schema,
  type World,
  type EntitySymbol,
} from "@/lib";

/**
 * Defines the options for creating a table (especially useful for local tables).
 *
 * @template M The type of any provided metadata for the table.
 * @param id The unique identifier for the table, usually—but not necessarily— a human-readable and descriptive name.
 * @param metadata (optional) Any additional metadata to be associated with the table.
 * @param indexed (optional) Whether the table should be indexed or not. Default: false.
 * @param persist (optional) Whether the table should be persisted in local storage or not. Default: false.
 */
export type TableOptions<M extends BaseTableMetadata> = {
  id: string; // default: uuid
  metadata?: Partial<M>;
  indexed?: boolean;
  persist?: boolean; // TODO
};

/**
 * Tables contain state indexed by entities.
 * Besides containing the state, components expose an rxjs update$ stream, that emits an event any time the value
 * of an entity in this table is updated.
 *
 * Note: This is modified from RECS.
 *
 * @param world {@link World} object this table should be registered onto.
 * @param propertiesSchema {@link Schema} of table properties (values). Uses Type enum as bridge between Typescript types and Javascript accessible values.
 * @param options Optional {@link TableOptions} with the following properties:
 * - `id` A descriptive id for this component (otherwise an autogenerated id is used)
 * - `metadata` Arbitrary metadata
 * - `indexed` If this flag is set, an indexer is applied to this component (see {@link createIndexer})
 * }
 * @returns Table object linked to the provided World
 * @category Tables
 * @internal
 */
export function createTable<PS extends Schema, M extends BaseTableMetadata, T = unknown>(
  world: World,
  propertiesSchema: PS,
  options?: TableOptions<M>,
) {
  if (Object.keys(propertiesSchema).length === 0) throw new Error("Table properties schema must have at least one key");
  const hasKeySchema = options?.metadata?.abiKeySchema && Object.keys(options.metadata.abiKeySchema).length > 0;

  // Native RECS entities iterator
  const entities = () =>
    transformIterator((Object.values(properties)[0] as Map<EntitySymbol, unknown>).keys(), getEntityHex);

  // Metadata
  const id = options?.id ?? uuid();
  const metadata = {
    ...options?.metadata,
    name: options?.metadata?.name ?? id,
    globalName: options?.metadata?.globalName ?? id,
    // generate abi types for the key schema in case none is provided
    // this will help having a unified API for all tables, including local tables created with RECS types
    // so we can use key methods on these as well
    abiKeySchema: hasKeySchema ? options.metadata!.abiKeySchema! : ({ entity: "bytes32" } as const),
  } as const satisfies BaseTableMetadata;

  const properties = mapObject(propertiesSchema, () => new Map()) as BaseTable<PS, typeof metadata, T>["properties"];
  const update$ = new Subject() as BaseTable<PS, typeof metadata, T>["update$"];

  const baseTable = {
    id,
    properties,
    propertiesSchema,
    metadata,
    world,
    entities,
    update$,
  };

  const table = {
    ...baseTable,
    ...createTableMethods(world, baseTable),
  } as const satisfies Table<PS, typeof metadata, T>;

  world.registerTable(table);
  if (options?.indexed) return createIndexer(table);
  return table;
}
