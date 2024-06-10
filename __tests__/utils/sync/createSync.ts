import { Read, Sync } from "@primodiumxyz/sync-stack";

import { StorageAdapter, createStorageAdapter } from "@/adapter";
import { ContractTableDefs } from "@/lib";

import {
  CreateSyncOptions,
  CreateIndexerSyncOptions,
  CreateRpcSyncOptions,
  CreateSyncResult,
  Sync as SyncType,
} from "@test/utils/sync/types";
import { hydrateFromIndexer, hydrateFromRpc, subToRpc } from "@test/utils/sync/handleSync";
import { SyncStep } from "@test/utils/sync/tables";

/* -------------------------------------------------------------------------- */
/*                                   GLOBAL                                   */
/* -------------------------------------------------------------------------- */

export const createSync = <tableDefs extends ContractTableDefs>({
  contractTables,
  localTables,
  tableDefs,
  networkConfig,
  onSync,
}: CreateSyncOptions<tableDefs>): CreateSyncResult => {
  const { complete: onComplete, error: onError } = onSync ?? {};
  const { publicClient, indexerUrl, initialBlockNumber } = networkConfig;

  const logFilters = Object.values(tableDefs).map((table) => ({ tableId: table.tableId as string }));
  const tables = { ...contractTables, ...localTables };

  const { storageAdapter, triggerUpdateStream } = createStorageAdapter({
    tables: contractTables,
    shouldSkipUpdateStream: () => localTables.SyncStatus.get()?.step !== SyncStep.Live,
  });

  const unsubs: (() => void)[] = [];
  const startSync = () => {
    // If an indexer url is provided, start by syncing from the indexer
    if (indexerUrl) {
      const sync = createIndexerSync({ storageAdapter, networkConfig, logFilters });
      unsubs.push(sync.unsubscribe);

      hydrateFromIndexer(tables, networkConfig, sync, {
        ...onSync,
        // When it's complete, sync remaining blocks from RPC
        // we don't pass the provided onComplete callback here because it will be called at the end of the RPC sync
        complete: async (lastBlock) => startRpcSync(lastBlock, storageAdapter, triggerUpdateStream),
        error: (error) => {
          onError?.(error);
          console.warn("Error hydrating from indexer");
          console.error(error);
          startRpcSync(initialBlockNumber, storageAdapter, triggerUpdateStream);
        },
      });
    } else {
      // Otherwise, start by syncing from RPC directly
      startRpcSync(initialBlockNumber, storageAdapter, triggerUpdateStream);
    }
  };

  const startRpcSync = async (
    startBlock: bigint | undefined,
    storageAdapter: StorageAdapter,
    triggerUpdateStream: () => void,
  ) => {
    // Create RPC sync from the latest block synced from the indexer (or initial block) up to the latest block
    const latestBlockNumber = await publicClient.getBlockNumber();
    const rpcSync = createRpcSync({
      storageAdapter,
      networkConfig,
      logFilters,
      startBlock: startBlock ?? initialBlockNumber,
      endBlock: latestBlockNumber,
    });
    unsubs.push(rpcSync.historical.unsubscribe);
    unsubs.push(rpcSync.live.unsubscribe);

    hydrateFromRpc(tables, rpcSync.historical, {
      ...onSync,
      // Once historical sync is complete, subscribe to new blocks
      complete: (blockNumber) => {
        onComplete?.(blockNumber);
        subToRpc(tables, rpcSync.live);
        triggerUpdateStream();
      },
    });
  };

  return { start: startSync, unsubscribe: () => unsubs.forEach((unsub) => unsub()) };
};

/* -------------------------------------------------------------------------- */
/*                                   INDEXER                                  */
/* -------------------------------------------------------------------------- */

const createIndexerSync = <tableDefs extends ContractTableDefs>({
  storageAdapter,
  networkConfig,
  logFilters,
}: CreateIndexerSyncOptions<tableDefs>): SyncType => {
  const { worldAddress, indexerUrl } = networkConfig;

  return Sync.withCustom({
    reader: Read.fromIndexer.filter({
      indexerUrl: indexerUrl!,
      filter: { address: worldAddress, filters: logFilters },
    }),
    writer: storageAdapter,
  });
};

/* -------------------------------------------------------------------------- */
/*                                     RPC                                    */
/* -------------------------------------------------------------------------- */

const createRpcSync = <tableDefs extends ContractTableDefs>({
  storageAdapter,
  networkConfig,
  logFilters,
  startBlock,
  endBlock,
}: CreateRpcSyncOptions<tableDefs>): { historical: SyncType; live: SyncType } => {
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
      writer: storageAdapter,
    }),
    live: Sync.withCustom({
      reader: Read.fromRPC.subscribe({
        address: worldAddress,
        publicClient,
        logFilter: logFilters,
      }),
      writer: storageAdapter,
    }),
  };
};
