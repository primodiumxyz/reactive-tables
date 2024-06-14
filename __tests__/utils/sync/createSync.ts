import { Read, Sync } from "@primodiumxyz/sync-stack";

import { ContractTableDefs } from "@/lib";

import { CreateSyncOptions, CreateSyncResult } from "@test/utils/sync/types";
import { hydrateFromRpc, subToRpc } from "@test/utils/sync/handleSync";

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

    // Sync all incoming blocks
    const liveRpcSync = Sync.withCustom({
      reader: Read.fromRPC.subscribe({
        address: worldAddress,
        publicClient,
        logFilter: logFilters,
      }),
      writer: storageAdapter,
    });

    unsubs.push(historicalRpcSync.unsubscribe);
    unsubs.push(liveRpcSync.unsubscribe);

    hydrateFromRpc(tables, historicalRpcSync, {
      ...onSync,
      // Once historical sync is complete, subscribe to new blocks
      complete: (blockNumber) => {
        onComplete?.(blockNumber);
        subToRpc(tables, liveRpcSync);
        triggerUpdateStream();
      },
    });
  };

  return { start: startSync, unsubscribe: () => unsubs.forEach((unsub) => unsub()) };
};
