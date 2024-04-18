import { Store as StoreConfig } from "@latticexyz/store";
import { World } from "@latticexyz/recs";
import { KeySchema } from "@latticexyz/store/internal";
import { createStore } from "tinybase/store";
import { createQueries } from "tinybase/queries";

import { createComponentMethods } from "@/store/component/createComponentMethods";
import { createComponentTable, createInternalComponentTable } from "@/store/component/createComponentTable";
import { setComponentTable } from "@/store/utils";
import { CreateComponentsStoreOptions, CreateComponentsStoreResult, ExtraTables } from "@/types";
import { Components } from "@/store/component/types";

export const createComponentsStore = <
  world extends World,
  config extends StoreConfig,
  extraTables extends ExtraTables,
>({
  world,
  tables,
}: CreateComponentsStoreOptions<world, config, extraTables>): CreateComponentsStoreResult<config, extraTables> => {
  // Create the TinyBase store & queries
  const store = createStore();
  const queries = createQueries(store);

  /* ------------------------------- COMPONENTS ------------------------------- */
  // Resolve tables into components (including internal tables)
  const components = Object.keys(tables).reduce((acc, key) => {
    const table = tables[key];
    if (table.namespace !== "internal" && Object.keys(table.valueSchema).length === 0)
      throw new Error("Component schema must have at least one key");

    const componentTable =
      // @ts-expect-error table misinterpreted as non-compatible type
      table.namespace === "internal" ? createInternalComponentTable(table) : createComponentTable(table);

    const methods = createComponentMethods({
      store,
      queries,
      // @ts-expect-error same here
      table: table,
      tableId: table.tableId,
      keySchema: table.keySchema as KeySchema,
    });

    // Register immutable data (basically formatted table) in the store for efficient access
    // @ts-expect-error table misinterpreted as non-compatible type
    if (table.namespace !== "internal") setComponentTable(store, componentTable);

    // @ts-expect-error component is generic and can only be indexed for reading.
    acc[key] = {
      ...componentTable,
      ...methods,
    };

    return acc;
  }, {}) as Components<typeof tables, config>;

  return { components, store, queries };
};
