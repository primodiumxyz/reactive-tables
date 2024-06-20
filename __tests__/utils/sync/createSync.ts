import { Read, Sync } from "@primodiumxyz/sync-stack";

import { StorageAdapterLog } from "@/adapter";
import { ContractTableDefs } from "@/lib";

import { CreateSyncOptions, CreateSyncResult } from "@test/utils/sync/types";
import { hydrateFromRpc, subToRpc } from "@test/utils/sync/handleSync";
import { SyncStep } from "@test/utils/sync/tables";

export const createSync = <tableDefs extends ContractTableDefs>({
  contractTables,
  localTables,
  tableDefs,
  storageAdapter,
  triggerUpdateStream,
  networkConfig,
  onSync,
}: CreateSyncOptions<tableDefs>): CreateSyncResult => {
  const { complete: onComplete } = onSync ?? {};
  const { publicClient, initialBlockNumber, worldAddress } = networkConfig;

  const logFilters = Object.values(tableDefs).map((table) => ({ tableId: table.tableId as string }));
  const tables = { ...contractTables, ...localTables };

  const unsubs: (() => void)[] = [];
  const startSync = async () => {
    // Create RPC sync from the latest block synced from the indexer (or initial block) up to the latest block
    const latestBlockNumber = await publicClient.getBlockNumber();

    // Sync all blocks from the initial block to the latest block
    const historicalRpcSync = Sync.withCustom({
      reader: Read.fromRPC.filter({
        address: worldAddress,
        publicClient,
        filter: { address: worldAddress, filters: logFilters },
        fromBlock: initialBlockNumber,
        toBlock: latestBlockNumber,
      }),
      writer: storageAdapter,
    });

    const pendingLogs: StorageAdapterLog[] = [];
    const storePendingLogs = (log: StorageAdapterLog) => pendingLogs.push(log);
    const processPendingLogs = () =>
      pendingLogs.forEach((log, index) => {
        storageAdapter(log);
        tables.SyncStatus.update({
          message: "Processing pending logs",
          progress: index / pendingLogs.length,
          lastBlockNumberProcessed: log.blockNumber ?? BigInt(0),
        });
      });

    // Sync incoming blocks
    const liveRpcSync = Sync.withCustom({
      reader: Read.fromRPC.subscribe({
        address: worldAddress,
        publicClient,
        logFilter: logFilters,
      }),
      // During historical sync, store all incoming blocks to process them after it's complete
      // Then, process logs directly
      writer: (logs) =>
        tables.SyncStatus.get()?.step === SyncStep.Live ? storageAdapter(logs) : storePendingLogs(logs),
    });

    // start live sync
    subToRpc(tables, liveRpcSync);
    // start historical sync
    hydrateFromRpc(tables, historicalRpcSync, {
      ...onSync,
      // Once historical sync is complete, process blocks that went in during historical sync, trigger the update stream
      // and set SyncStatus.step to SyncStep.Live so it starts directly processing blocks
      complete: (blockNumber) => {
        onComplete?.(blockNumber);
        // process blocks that went in during historical sync
        processPendingLogs();
        // now we're truly up to date
        triggerUpdateStream();
      },
    });

    unsubs.push(historicalRpcSync.unsubscribe);
    unsubs.push(liveRpcSync.unsubscribe);
  };

  return { start: startSync, unsubscribe: () => unsubs.forEach((unsub) => unsub()) };
};
