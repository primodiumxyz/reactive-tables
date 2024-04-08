import { Store as StoreConfig } from "@latticexyz/store";
import { World } from "@latticexyz/recs";
import { Tables } from "@latticexyz/store/internal";
import { tablesToComponents } from "@latticexyz/store-sync/src/recs/tablesToComponents";
import { defineInternalComponents } from "@latticexyz/store-sync/src/recs/defineInternalComponents";
import { mapObject } from "@latticexyz/common/utils";
import { createStore } from "tinybase";

import { createStorageAdapter } from "./createStorageAdapter";
import { CreateComponentStoreOptions, CreateComponentStoreResult } from "@/types";

export const createComponentStore = <world extends World, config extends StoreConfig, tables extends Tables>({
  world,
  tables,
  extend,
}: CreateComponentStoreOptions<world, config, tables>): CreateComponentStoreResult => {
  // Resolve tables into components (from recsStorage)
  const components = {
    ...tablesToComponents(world, tables),
    ...defineInternalComponents(world),
  };

  const store = createStore();
  mapObject(tables, (table) => {
    // store.setTable(name, table);
  });

  // Create the storage adapter for syncing with the sync-stack
  const storageAdapter = createStorageAdapter({ store });

  // setTablesSchema: https://tinybase.org/api/store/interfaces/store/store/methods/setter/settablesschema/

  // TODO Add basic ways to update components (set, update, etc.) - we might not even need to mention
  // 'extended' components but just do it as a base for this library
  // Basically to ease access/update, and this would be the react bindings as well

  return { store, storageAdapter };
};
