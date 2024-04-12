import { Store as StoreConfig } from "@latticexyz/store";
import { World } from "@latticexyz/recs";
import { Read, Sync } from "@primodiumxyz/sync-stack";
import { Tables } from "@latticexyz/store/internal";

import { createCustomWriter } from "@/sync/createCustomWriter";
import { CreateSyncOptions, CreateSyncResult } from "@/types";

export const createSync = async <world extends World, config extends StoreConfig, tables extends Tables>({
  world,
  store,
  networkConfig,
  publicClient,
}: CreateSyncOptions<world, config, tables>): Promise<CreateSyncResult> => {
  const { worldAddress, indexerUrl } = networkConfig;

  // TODO: pass filters when creating wrapper, opt in/out of some tables, e.g. store, world, base
  const logFilters = Object.values(store.getTables()).map((table) => ({ tableId: table.metadata.id as string }));

  return {
    // TODO: if I were to pass an array of readers, how to have them launch one by one? (i.e. not have live rpc run before historical is done)
    indexer: indexerUrl
      ? Sync.withCustom({
          reader: Read.fromIndexer.filter({
            indexerUrl,
            filter: { address: worldAddress, filters: logFilters },
          }),
          writer: createCustomWriter({ store }),
        })
      : undefined,
    rpc: Sync.withCustom({
      reader: Read.fromRPC.filter({
        address: worldAddress,
        publicClient,
        filter: { address: worldAddress, filters: logFilters },
        fromBlock: networkConfig.initialBlockNumber,
        toBlock: await publicClient.getBlockNumber(),
      }),
      writer: createCustomWriter({ store }),
    }),
    live: Sync.withCustom({
      reader: Read.fromRPC.subscribe({
        address: worldAddress,
        publicClient,
        logFilter: logFilters,
      }),
      writer: createCustomWriter({ store }),
    }),
  };
};
