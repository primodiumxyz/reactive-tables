import { ContractTables } from "@/tables";
import { StorageAdapter } from "@/adapter";
import { ContractTableDefs } from "@/lib";

import { createLocalSyncTables } from "@test/utils/sync/tables";
import { NetworkConfig } from "@test/utils/networkConfig";

export type AllTables<tableDefs extends ContractTableDefs> = ContractTables<tableDefs> & LocalSyncTables;
export type LocalSyncTables = ReturnType<typeof createLocalSyncTables>;

export type CreateSyncOptions<tableDefs extends ContractTableDefs> = {
  contractTables: ContractTables<tableDefs>;
  localTables: LocalSyncTables;
  tableDefs: ContractTableDefs;
  storageAdapter: StorageAdapter;
  triggerUpdateStream: () => void;
  networkConfig: NetworkConfig;
  onSync?: OnSyncCallbacks;
};

export type CreateSyncResult = {
  start: () => void;
  unsubscribe: () => void;
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
