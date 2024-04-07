import { Table } from "@latticexyz/store-sync";
import { RecsStorageAdapter } from "@latticexyz/store-sync/recs";
import { Address, Chain, PublicClient } from "viem";

export interface NetworkConfig {
  chain: Chain;
  worldAddress: Address;
  indexerUrl?: string;
  initialBlockNumber?: bigint;
}

/* -------------------------------------------------------------------------- */
/*                                    SYNC                                    */
/* -------------------------------------------------------------------------- */

export type Sync = {
  start: (
    onProgress?: (index: number, blockNumber: bigint, progress: number) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error?: (err: any) => void,
  ) => void;
  unsubscribe: () => void;
};

export type OnSyncCallbacks = {
  progress: (progress: number) => void;
  complete: () => void;
  error: (error: Error) => void;
};
