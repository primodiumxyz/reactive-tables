import { Store as StoreConfig } from "@latticexyz/store";
import { World } from "@latticexyz/recs";
import { Tables } from "@latticexyz/store/internal";
import { mapObject } from "@latticexyz/common/utils";
import { createStore } from "tinybase";

import { createStorageAdapter } from "./createStorageAdapter";
import { CreateComponentStoreOptions, CreateComponentStoreResult } from "@/types";
import { recsStorage } from "@latticexyz/store-sync/recs";

export const createComponentStore = <world extends World, config extends StoreConfig, tables extends Tables>({
  world,
  tables,
  extend,
}: CreateComponentStoreOptions<world, config, tables>): CreateComponentStoreResult => {
  // Resolve tables into components
  const { components } = recsStorage({ world, tables });

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
