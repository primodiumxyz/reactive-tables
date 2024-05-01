import { Read, Sync } from "@primodiumxyz/sync-stack";

import { createStorageAdapter } from "@/adapter";

import {
  CreateSyncOptions,
  CreateIndexerSyncOptions,
  CreateRpcSyncOptions,
  CreateSyncResult,
  Sync as SyncType,
} from "@test/utils/sync/types";
import { hydrateFromIndexer, hydrateFromRpc, subToRpc } from "@test/utils/sync/handleSync";

/* -------------------------------------------------------------------------- */
/*                                   GLOBAL                                   */
/* -------------------------------------------------------------------------- */

export const createSync = ({
  registry,
  store,
  tableDefs,
  networkConfig,
  onSync,
}: CreateSyncOptions): CreateSyncResult => {
  const { complete: onComplete, error: onError } = onSync ?? {};
  const { publicClient, indexerUrl, initialBlockNumber } = networkConfig;

  const logFilters = Object.values(tableDefs).map((table) => ({ tableId: table.tableId as string }));

  const unsubs: (() => void)[] = [];
  const startSync = () => {
    // If an indexer url is provided, start by syncing from the indexer
    if (indexerUrl) {
      const sync = createIndexerSync({ store, networkConfig, logFilters });
      unsubs.push(sync.unsubscribe);

      hydrateFromIndexer(registry, networkConfig, sync, {
        ...onSync,
        // When it's complete, sync remaining blocks from RPC
        // we don't pass the provided onComplete callback here because it will be called at the end of the RPC sync
        complete: async (lastBlock) => startRpcSync(lastBlock),
        error: (error) => {
          onError?.(error);
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
      logFilters,
      startBlock: startBlock ?? initialBlockNumber,
      endBlock: latestBlockNumber,
    });
    unsubs.push(rpcSync.historical.unsubscribe);
    unsubs.push(rpcSync.live.unsubscribe);

    hydrateFromRpc(registry, rpcSync.historical, {
      ...onSync,
      // Once historical sync is complete, subscribe to new blocks
      complete: (blockNumber) => {
        onComplete?.(blockNumber);
        subToRpc(registry, rpcSync.live);
      },
    });
  };

  return { start: startSync, unsubscribe: () => unsubs.forEach((unsub) => unsub()) };
};

/* -------------------------------------------------------------------------- */
/*                                   INDEXER                                  */
/* -------------------------------------------------------------------------- */

const createIndexerSync = ({ store, networkConfig, logFilters }: CreateIndexerSyncOptions): SyncType => {
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

const createRpcSync = ({
  store,
  networkConfig,
  logFilters,
  startBlock,
  endBlock,
}: CreateRpcSyncOptions): { historical: SyncType; live: SyncType } => {
  const { publicClient, worldAddress } = networkConfig;

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
