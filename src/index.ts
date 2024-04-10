import { Store as StoreConfig } from "@latticexyz/store";
import { World } from "@latticexyz/recs";
import { storeToV1 } from "@latticexyz/store/config/v2";
import { Tables, resolveConfig } from "@latticexyz/store/internal";

import { createComponentsStore } from "@/store";
import { createSync, handleSync } from "@/sync";
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
    progress: (index, blockNumber, progress) => console.log(`Syncing: ${progress}%`),
    complete: () => console.log("Sync complete"),
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
  const sync = await createSync({ world, store, networkConfig, publicClient: client });
  if (startSync) {
    handleSync(components, sync, onSync);
  }

  // TODO: fix annoying type issue
  return { components, tables, publicClient: client, sync };
};
