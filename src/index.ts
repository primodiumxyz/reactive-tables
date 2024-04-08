import { Store as StoreConfig } from "@latticexyz/store";
import { World } from "@latticexyz/recs";
import { storeToV1 } from "@latticexyz/store/config/v2";
import { Tables, resolveConfig } from "@latticexyz/store/internal";

import { createComponentStore } from "@/store";
import { createSync, handleSync } from "@/sync";
import { createPublicClient } from "@/utils";
import { TinyBaseWrapperOptions, NetworkConfig, TinyBaseWrapperResult, AllTables } from "@/types";

export const tinyBaseWrapper = async <
  world extends World,
  config extends StoreConfig,
  networkConfig extends NetworkConfig,
  extraTables extends Tables | undefined,
>({
  world,
  mudConfig,
  networkConfig,
  otherTables,
  publicClient,
  extend = true, // extend components with additional methods? TODO: might do it anyway as a base
  startSync = true, // start sync immediately?
  onSync = {
    progress: (index, blockNumber, progress) => console.log(`Syncing: ${progress}%`),
    complete: () => console.log("Sync complete"),
    error: (err) => console.error("Sync error", err),
  },
  // TODO: initialQueries?
}: TinyBaseWrapperOptions<world, config, networkConfig, extraTables>): Promise<
  TinyBaseWrapperResult<config, extraTables>
> => {
  const client = publicClient ?? createPublicClient(networkConfig);

  /* --------------------------------- TABLES --------------------------------- */
  // Resolve tables
  const tables = {
    ...resolveConfig(storeToV1(mudConfig as StoreConfig)).tables,
    ...(otherTables ?? {}),
  } as unknown as AllTables<config, extraTables>;

  /* ------------------------------- COMPONENTS ------------------------------- */
  // TODO: this will later return extended components (`get()`, `use()`, etc)
  /**
   * So when we return "components", we're essentially returning the store with methods to
   * ease access/modification of components
   * e.g. (conceptually) instead of `const { Entity } = useStore((state) => state.Entity)` and then
   *
   */
  const { store, storageAdapter } = createComponentStore({ world, tables, extend });

  /* ---------------------------------- SYNC ---------------------------------- */
  // Create custom writer, and setup sync
  const sync = createSync({ world, tables, networkConfig, publicClient: client, storageAdapter });
  if (startSync) {
    handleSync(sync, {
      ...onSync,
      progress: (index, blockNumber, progress) => {
        // TODO: is it relevant to write progress to store here in addition to the provided callback?
        store.setValue("syncProgress", progress);
        onSync.progress(index, blockNumber, progress);
      },
    });
  }

  return { store, tables, publicClient: client, sync };
};
