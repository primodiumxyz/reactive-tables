import { Store as StoreConfig } from "@latticexyz/store";
import { World } from "@latticexyz/recs";
import { storeToV1 } from "@latticexyz/store/config/v2";
import { Tables, resolveConfig } from "@latticexyz/store/internal";

import { createComponentsStore } from "@/store";
import { createSync } from "@/sync";
import { createPublicClient } from "@/utils";
import { TinyBaseWrapperOptions, NetworkConfig, TinyBaseWrapperResult, AllTables } from "@/types";

import { storeTables, worldTables } from "@latticexyz/store-sync";
import { internalTables } from "@/constants";

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
  startSync = true, // start sync immediately?
  onSync = {
    progress: (_, __, progress) => console.log(`Syncing: ${(progress * 100).toFixed()}%`),
    complete: (blockNumber) => console.log("Sync complete, latest block:", blockNumber?.toString() ?? "unknown"),
    error: (err) => console.error("Sync error", err),
  },

  // TODO: initialQueries
}: TinyBaseWrapperOptions<world, config, networkConfig, extraTables>): Promise<
  TinyBaseWrapperResult<config, extraTables>
> => {
  const client = publicClient ?? createPublicClient(networkConfig);

  /* --------------------------------- TABLES --------------------------------- */
  // Resolve tables
  const tables = {
    ...resolveConfig(storeToV1(mudConfig as StoreConfig)).tables,
    ...(otherTables ?? {}),
    ...storeTables,
    ...worldTables,
    ...internalTables, // e.g. sync components
  } as unknown as AllTables<config, extraTables>;

  /* ------------------------------- COMPONENTS ------------------------------- */
  const { components, store } = createComponentsStore({ world, tables });

  /* ---------------------------------- SYNC ---------------------------------- */
  // Create custom writer, and setup sync
  const sync = createSync({ components, store, networkConfig, publicClient: client, onSync });
  if (startSync) {
    sync.start();
    world.registerDisposer(sync.unsubscribe);
  }

  // TODO: fix annoying type issue
  return { components, tables, store, sync, publicClient: client };
};
