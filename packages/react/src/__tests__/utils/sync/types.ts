import { PublicClient } from "viem";
import { Store } from "tinybase/store";

import { NetworkConfig } from "@/types";
import { MUDTables } from "@/components/types";
import { ContractTables } from "@/components/contract/types";
import { createInternalSyncComponents } from "@/__tests__/utils/sync/components";

export type CreateSyncOptions<tables extends MUDTables> = {
  components: ContractTables<tables> & ReturnType<typeof createInternalSyncComponents>;
  store: Store;
  networkConfig: NetworkConfig;
  publicClient: PublicClient;
  onSync: OnSyncCallbacks;
};

export type CreateSyncResult = {
  start: () => void;
  unsubscribe: () => void;
};

export type CreateIndexerSyncOptions<tables extends MUDTables> = Omit<
  CreateSyncOptions<tables>,
  "components" | "publicClient" | "onSync"
> & {
  logFilters: { tableId: string }[];
};

export type CreateRpcSyncOptions<tables extends MUDTables> = Omit<
  CreateSyncOptions<tables>,
  "components" | "onSync"
> & {
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
