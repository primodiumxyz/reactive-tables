import { CreateSyncOptions, CreateSyncResult } from "@/types";
import { World } from "@latticexyz/recs";
import { Read, Sync } from "@primodiumxyz/sync-stack";
import { Tables } from "@latticexyz/store/internal";

import { createCustomWriter } from "./createCustomWriter";

export const createSync = <world extends World, tables extends Tables>({
  world,
  tables,
  networkConfig,
  publicClient,
  storageAdapter,
}: CreateSyncOptions<world, tables>): CreateSyncResult => {
  const { worldAddress, indexerUrl, initialBlockNumber } = networkConfig;
  const useIndexer = indexerUrl && initialBlockNumber;

  return Sync.withCustom({
    // TODO: figure out if we want to return various readers or just handle
    // syncing with indexer and remaining with RPC (or direct if failure)
    reader: Read.fromRPC.subscribe({
      address: networkConfig.worldAddress,
      publicClient,
    }),
    writer: createCustomWriter({ storageAdapter }),
  });
};
