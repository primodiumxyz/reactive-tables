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
  const { worldAddress, indexerUrl, initialBlockNumber } = networkConfig;
  const useIndexer = indexerUrl && initialBlockNumber;

  // TODO: pass filters when creating wrapper, opt in/out of some tables, e.g. store, world, base
  const logFilters = Object.values(store.getTables()).map((table) => ({ tableId: table.metadata.id as string }));

  return {
    // TODO: only RPC right now
    historical: Sync.withCustom({
      reader: Read.fromRPC.filter({
        address: networkConfig.worldAddress,
        publicClient, // TODO: viem version mismatch, 2.7.12 -> 1.14.0
        filters: logFilters,
        fromBlock: networkConfig.initialBlockNumber,
        toBlock: await publicClient.getBlockNumber(),
      }),
      writer: createCustomWriter({ store }),
    }),
    live: Sync.withCustom({
      reader: Read.fromRPC.subscribe({
        address: networkConfig.worldAddress,
        publicClient, // TODO: viem version mismatch, 2.7.12 -> 1.14.0
        logFilter: logFilters,
      }),
      writer: createCustomWriter({ store }),
    }),
  };
};
