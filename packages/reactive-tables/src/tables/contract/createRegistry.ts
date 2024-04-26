import { createTableMethods } from "@/tables/createTableMethods";
import { createMetadata } from "@/tables/contract/createMetadata";
import { ContractTableDefs, StoreConfig, mapObject, storePropertiesSchema } from "@/lib";
import { CreateContractTablesOptions } from "@/tables/types";
import { ContractTables } from "@/tables/contract/types";

/**
 * Creates a registry of contract tables with both their metadata (see {@link createMetadata}) and methods to retrieve/update
 * properties (see {@link createTableMethods}).
 *
 * @param tableDefs The contract table definitions.
 * @param store The regular TinyBase store.
 * @param queries The TinyBase queries object associated with the store.
 * @returns The contract tables registry.
 * @category Tables
 * @internal
 */
export const createRegistry = <config extends StoreConfig, extraTableDefs extends ContractTableDefs | undefined>({
  tableDefs,
  store,
  queries,
}: CreateContractTablesOptions<config, extraTableDefs>) => {
  return mapObject(tableDefs, (def) => {
    if (Object.keys(def.valueSchema).length === 0) throw new Error("Schema definition must have at least one key");

    const metadata = createMetadata(def);
    const methods = createTableMethods({
      store,
      queries,
      metadata: {
        ...def,
        schema: metadata.schema,
        keySchema: metadata.metadata.keySchema,
        propsSchema: metadata.metadata.propsSchema,
      },
    });

    // Store properties schema in TinyBase for easier access in the storage adapter
    storePropertiesSchema(store, def.tableId, metadata.metadata.propsSchema);

    return {
      ...metadata,
      ...methods,
    };
  }) as unknown as ContractTables<typeof tableDefs>;
};