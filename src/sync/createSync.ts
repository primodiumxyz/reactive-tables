import { Store as StoreConfig } from "@latticexyz/store";
import { World } from "@latticexyz/recs";
import { Read, Sync } from "@primodiumxyz/sync-stack";
import { Tables } from "@latticexyz/store/internal";

import { createCustomWriter } from "@/sync/createCustomWriter";
import { CreateSyncOptions, CreateSyncResult } from "@/types";

export const createSync = <world extends World, config extends StoreConfig, tables extends Tables>({
  world,
  store,
  networkConfig,
  publicClient,
}: CreateSyncOptions<world, config, tables>): CreateSyncResult => {
  const { worldAddress, indexerUrl, initialBlockNumber } = networkConfig;
  const useIndexer = indexerUrl && initialBlockNumber;

  return Sync.withCustom({
    // TODO: figure out if we want to return various readers or just handle
    // syncing with indexer and remaining with RPC (or direct if failure)
    reader: Read.fromRPC.subscribe({
      address: networkConfig.worldAddress,
      publicClient, // TODO: viem version mismatch, 2.7.12 -> 1.14.0
    }),
    writer: createCustomWriter({ store }),
  });
};
