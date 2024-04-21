import { Store as StoreConfig } from "@latticexyz/store";
import { Read, Sync } from "@primodiumxyz/sync-stack";

import { createStorageAdapter } from "@/adapter";
import {
  CreateSyncOptions,
  CreateIndexerSyncOptions,
  CreateRpcSyncOptions,
  CreateSyncResult,
  Sync as SyncType,
} from "@/__tests__/utils/sync/types";

import { hydrateFromIndexer, hydrateFromRpc, subToRpc } from "./handleSync";
import { ExtraTables } from "@/types";

/* -------------------------------------------------------------------------- */
/*                                   GLOBAL                                   */
/* -------------------------------------------------------------------------- */

export const createSync = <config extends StoreConfig, extraTables extends ExtraTables>({
  components,
  store,
  networkConfig,
  publicClient,
  onSync,
}: CreateSyncOptions<config, extraTables>): CreateSyncResult => {
  const { complete: onComplete } = onSync;
  const { indexerUrl, initialBlockNumber } = networkConfig;

  const logFilters = Object.values(components).map((table) => ({ tableId: table.id as string }));

  let unsubs: (() => void)[] = [];
  const startSync = () => {
    // If an indexer url is provided, start by syncing from the indexer
    if (indexerUrl) {
      const sync = createIndexerSync({ store, networkConfig, logFilters });
      unsubs.push(sync.unsubscribe);

      hydrateFromIndexer(components, networkConfig, sync, {
        ...onSync,
        // When it's complete, sync remaining blocks from RPC
        complete: async (lastBlock) => startRpcSync(lastBlock),
        error: (error) => {
          console.warn("Error hydrating from indexer");
          console.error(error);
          startRpcSync(initialBlockNumber);
        },
      });
    } else {
      // Otherwise, start by syncing from RPC directly
      startRpcSync(initialBlockNumber);
    }
  };

  const startRpcSync = async (startBlock: bigint | undefined) => {
    // Create RPC sync from the latest block synced from the indexer (or initial block) up to the latest block
    const latestBlockNumber = await publicClient.getBlockNumber();
    const rpcSync = createRpcSync({
      store,
      networkConfig,
      publicClient,
      logFilters,
      startBlock: startBlock ?? initialBlockNumber,
      endBlock: latestBlockNumber,
    });
    unsubs.push(rpcSync.historical.unsubscribe);
    unsubs.push(rpcSync.live.unsubscribe);

    hydrateFromRpc(components, rpcSync.historical, {
      ...onSync,
      // Once historical sync is complete, subscribe to new blocks
      complete: (blockNumber) => {
        onComplete(blockNumber);
        subToRpc(components, rpcSync.live);
      },
    });
  };

  return { start: startSync, unsubscribe: () => unsubs.forEach((unsub) => unsub()) };
};

/* -------------------------------------------------------------------------- */
/*                                   INDEXER                                  */
/* -------------------------------------------------------------------------- */

const createIndexerSync = <config extends StoreConfig, extraTables extends ExtraTables>({
  store,
  networkConfig,
  logFilters,
}: CreateIndexerSyncOptions<config, extraTables>): SyncType => {
  const { worldAddress, indexerUrl } = networkConfig;

  return Sync.withCustom({
    reader: Read.fromIndexer.filter({
      indexerUrl: indexerUrl!,
      filter: { address: worldAddress, filters: logFilters },
    }),
    writer: createStorageAdapter({ store }),
  });
};

/* -------------------------------------------------------------------------- */
/*                                     RPC                                    */
/* -------------------------------------------------------------------------- */

const createRpcSync = <config extends StoreConfig, extraTables extends ExtraTables>({
  store,
  networkConfig,
  publicClient,
  logFilters,
  startBlock,
  endBlock,
}: CreateRpcSyncOptions<config, extraTables>): { historical: SyncType; live: SyncType } => {
  const { worldAddress } = networkConfig;

  return {
    historical: Sync.withCustom({
      reader: Read.fromRPC.filter({
        address: worldAddress,
        publicClient,
        filter: { address: worldAddress, filters: logFilters },
        fromBlock: startBlock,
        toBlock: endBlock,
      }),
      writer: createStorageAdapter({ store }),
    }),
    live: Sync.withCustom({
      reader: Read.fromRPC.subscribe({
        address: worldAddress,
        publicClient,
        logFilter: logFilters,
      }),
      writer: createStorageAdapter({ store }),
    }),
  };
};
