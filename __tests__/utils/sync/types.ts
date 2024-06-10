import { ContractTables } from "@/tables";
import { StorageAdapter } from "@/adapter";
import { ContractTableDefs } from "@/lib";

import { createLocalSyncTables } from "@test/utils/sync/tables";
import { NetworkConfig } from "@test/utils/networkConfig";

export type CreateSyncOptions<tableDefs extends ContractTableDefs> = {
  contractTables: ContractTables<tableDefs>;
  localTables: ReturnType<typeof createLocalSyncTables>;
  tableDefs: ContractTableDefs;
  networkConfig: NetworkConfig;
  onSync?: OnSyncCallbacks;
};

export type CreateSyncResult = {
  start: () => void;
  unsubscribe: () => void;
};

export type CreateIndexerSyncOptions<tableDefs extends ContractTableDefs> = Omit<
  CreateSyncOptions<tableDefs>,
  "contractTables" | "localTables" | "tableDefs" | "publicClient" | "onSync"
> & {
  storageAdapter: StorageAdapter;
  logFilters: { tableId: string }[];
};

export type CreateRpcSyncOptions<tableDefs extends ContractTableDefs> = Omit<
  CreateSyncOptions<tableDefs>,
  "contractTables" | "localTables" | "tableDefs" | "onSync"
> & {
  storageAdapter: StorageAdapter;
  logFilters: { tableId: string }[];
  startBlock: bigint;
  endBlock: bigint;
};

export type Sync = {
  start: (
    onProgress?: (index: number, blockNumber: bigint, progress: number) => void,
    error?: (err: unknown) => void,
  ) => void;
  unsubscribe: () => void;
};

export type OnSyncCallbacks = {
  progress?: (index: number, blockNumber: bigint, progress: number) => void;
  complete?: (blockNumber?: bigint) => void;
  error?: (err: unknown) => void;
};
