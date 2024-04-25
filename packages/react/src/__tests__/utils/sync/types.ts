import { Store } from "tinybase/store";

import { ContractTableDefs } from "@/lib";

import { createLocalSyncTables } from "@/__tests__/utils/sync/tables";
import { NetworkConfig } from "@/__tests__/utils/init";

export type CreateSyncOptions = {
  registry: ReturnType<typeof createLocalSyncTables>;
  store: Store;
  tableDefs: ContractTableDefs;
  networkConfig: NetworkConfig;
  onSync: OnSyncCallbacks;
};

export type CreateSyncResult = {
  start: () => void;
  unsubscribe: () => void;
};

export type CreateIndexerSyncOptions = Omit<CreateSyncOptions, "registry" | "tableDefs" | "publicClient" | "onSync"> & {
  logFilters: { tableId: string }[];
};

export type CreateRpcSyncOptions = Omit<CreateSyncOptions, "registry" | "tableDefs" | "onSync"> & {
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
  progress: (index: number, blockNumber: bigint, progress: number) => void;
  complete: (blockNumber?: bigint) => void;
  error: (err: unknown) => void;
};
