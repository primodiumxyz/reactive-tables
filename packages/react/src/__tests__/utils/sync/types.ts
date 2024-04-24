import { Store } from "tinybase/store";

import { MUDTables } from "@/components/types";
import { createInternalSyncComponents } from "@/__tests__/utils/sync/components";
import { NetworkConfig } from "@/__tests__/utils/init";

export type CreateSyncOptions = {
  components: ReturnType<typeof createInternalSyncComponents>;
  store: Store;
  tables: MUDTables;
  networkConfig: NetworkConfig;
  onSync: OnSyncCallbacks;
};

export type CreateSyncResult = {
  start: () => void;
  unsubscribe: () => void;
};

export type CreateIndexerSyncOptions = Omit<CreateSyncOptions, "components" | "tables" | "publicClient" | "onSync"> & {
  logFilters: { tableId: string }[];
};

export type CreateRpcSyncOptions = Omit<CreateSyncOptions, "components" | "tables" | "onSync"> & {
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
