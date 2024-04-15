import { Store as StoreConfig } from "@latticexyz/store";
import { World } from "@latticexyz/recs";
import { Tables } from "@latticexyz/store/internal";
import { createStore } from "tinybase/store";

import { createComponentMethods } from "@/store/component/createComponentMethods";
import { setComponentTable } from "@/store/utils";
import { CreateComponentsStoreOptions, CreateComponentsStoreResult } from "@/types";
import { Components } from "@/store/component/types";
import { createComponentTable } from "./component/createComponentTable";
import { InternalComponents } from "./internal/types";

export const createComponentsStore = <
  world extends World,
  config extends StoreConfig,
  extraTables extends Tables | undefined,
>({
  world,
  tables,
  internalComponentsTables,
}: CreateComponentsStoreOptions<world, config, extraTables>): CreateComponentsStoreResult<config, extraTables> => {
  // Create the TinyBase store
  const store = createStore();

  /* ------------------------------- COMPONENTS ------------------------------- */
  // Resolve tables into components
  const components = Object.keys(tables).reduce((acc, key) => {
    const table = tables[key];
    if (Object.keys(table.valueSchema).length === 0) throw new Error("Component schema must have at least one key");

    // @ts-expect-error table misinterpreted as non-compatible type
    const componentTable = createComponentTable(table, store);

    const methods = createComponentMethods({
      store,
      tableId: table.tableId,
    });

    // Register immutable data (basically formatted table) in the store for efficient access
    setComponentTable(store, componentTable);

    // @ts-expect-error component is generic and can only be indexed for reading.
    acc[key] = {
      ...componentTable,
      ...methods,
    };

    return acc;
  }, {}) as Components<typeof tables, config>;

  /* --------------------------- INTERNAL COMPONENTS -------------------------- */
  const extendedInternalComponents = Object.keys(internalComponentsTables).reduce((acc, key) => {
    const typedKey = key as keyof typeof internalComponentsTables;
    const table = internalComponentsTables[typedKey];

    // TODO: figure out if it's ok; we're using the same methods as regular components but with
    // the typing from internal components, which basically excludes using a key, and remove metadata from values
    // so we get the type-safety as expected
    const methods = createComponentMethods({
      store,
      tableId: table.id,
    });

    // @ts-expect-error internal components keys do not exist on object
    acc[typedKey] = {
      ...table,
      ...methods,
    };

    return acc;
  }, {}) as InternalComponents<typeof internalComponentsTables>;

  return { components: { ...components, ...extendedInternalComponents }, store };
};
