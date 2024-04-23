import { Store as StoreConfig } from "@latticexyz/store";
import { World } from "@latticexyz/recs";
import { createStore } from "tinybase/store";
import { createQueries } from "tinybase/queries";

import { createComponentMethods } from "@/components/createComponentMethods";
import { createComponentTable } from "@/components/createComponentTable";
import { setComponentTable } from "@/components/utils";
import { CreateComponentsStoreOptions, CreateComponentsStoreResult, ExtraTables } from "@/types";
import { Components } from "@/components/contract/types";

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

  // Resolve tables into components
  const components = Object.keys(tables).reduce(
    (acc, key) => {
      const table = tables[key];
      if (table.namespace !== "internal" && Object.keys(table.valueSchema).length === 0)
        throw new Error("Component schema must have at least one key");

      const componentTable = createComponentTable(table);

      const methods = createComponentMethods({
        store,
        queries,
        table: { ...table, ...componentTable },
        tableId: table.tableId,
      });

      setComponentTable(store, componentTable);

      acc[key as keyof typeof tables] = {
        ...componentTable,
        ...methods,
      };

      return acc;
    },
    {} as Components<typeof tables, config>,
  );

  return { components, store, queries };
};
