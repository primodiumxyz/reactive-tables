import { NetworkConfig } from "@/types";
import { World } from "@latticexyz/recs";
import { Table } from "@latticexyz/store-sync";
import { Read, Sync } from "@primodiumxyz/sync-stack";
import { PublicClient } from "viem";

import { createCustomWriter } from "./createCustomWriter";

export const createSync = <world extends World, tables extends Record<string, Table>>(args: {
  world: world;
  tables: tables;
  networkConfig: NetworkConfig;
  publicClient: PublicClient;
}) => {
  const { world, tables, networkConfig, publicClient } = args;
  const { worldAddress, indexerUrl, initialBlockNumber } = networkConfig;

  const useIndexer = indexerUrl && initialBlockNumber;

  return Sync.withCustom({
    // TODO: figure out if we want to return various readers or just handle
    // syncing with indexer and remaining with RPC (or direct if failure)
    reader: Read.fromRPC.subscribe({
      address: networkConfig.worldAddress,
      publicClient,
    }),
    writer: createCustomWriter(),
  });
};
