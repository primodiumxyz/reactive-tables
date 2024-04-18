import { Store as StoreConfig } from "@latticexyz/store";
import { PublicClient } from "viem";
import { Store } from "tinybase/store";

import { AllComponents, ExtraTables, NetworkConfig } from "@/types";

export type CreateSyncOptions<config extends StoreConfig, extraTables extends ExtraTables> = {
  components: AllComponents<config, extraTables>;
  store: Store;
  networkConfig: NetworkConfig;
  publicClient: PublicClient;
  onSync: OnSyncCallbacks;
};

export type CreateSyncResult = {
  start: () => void;
  unsubscribe: () => void;
};

export type CreateIndexerSyncOptions<config extends StoreConfig, extraTables extends ExtraTables> = Omit<
  CreateSyncOptions<config, extraTables>,
  "components" | "publicClient" | "onSync"
> & {
  logFilters: { tableId: string }[];
};

export type CreateRpcSyncOptions<config extends StoreConfig, extraTables extends ExtraTables> = Omit<
  CreateSyncOptions<config, extraTables>,
  "components" | "onSync"
> & {
  logFilters: { tableId: string }[];
  startBlock: bigint;
  endBlock: bigint;
};

export type Sync = {
  start: (
    onProgress?: (index: number, blockNumber: bigint, progress: number) => void,
    error?: (err: any) => void,
  ) => void;
  unsubscribe: () => void;
};

export type OnSyncCallbacks = {
  progress: (index: number, blockNumber: bigint, progress: number) => void;
  complete: (blockNumber?: bigint) => void;
  error: (err: any) => void;
};
