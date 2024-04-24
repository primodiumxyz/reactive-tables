import { Store as StoreConfig } from "@latticexyz/store";
import { mapObject } from "@latticexyz/utils";

import { createComponentMethods } from "@/components/createComponentMethods";
import { createComponentTable } from "@/components/createComponentTable";
import { MUDTables, storeValueSchema } from "@/lib";
import { CreateComponentsStoreOptions } from "@/components/types";
import { ContractTables } from "@/components/contract/types";

export const createComponentsStore = <config extends StoreConfig, extraTables extends MUDTables>({
  tables,
  store,
  queries,
}: CreateComponentsStoreOptions<config, extraTables>) => {
  return mapObject(tables, (table) => {
    if (Object.keys(table.valueSchema).length === 0) throw new Error("Component schema must have at least one key");

    const metadata = createComponentTable(table);
    const methods = createComponentMethods({
      store,
      queries,
      metadata: {
        ...table,
        schema: metadata.schema,
        keySchema: metadata.metadata.keySchema,
        valueSchema: metadata.metadata.valueSchema,
      },
    });

    // Store value schema in TinyBase for easier access in the storage adapter
    storeValueSchema(store, table.tableId, metadata.metadata.valueSchema);

    return {
      ...metadata,
      ...methods,
    };
  }) as unknown as ContractTables<typeof tables>;
};
