import { World } from "@latticexyz/recs";
import { Store as StoreConfig } from "@latticexyz/store";
import { StorageAdapter, storeTables, worldTables } from "@latticexyz/store-sync";
import { MUDChain } from "@latticexyz/common/chains";
import { ResolvedStoreConfig, Tables } from "@latticexyz/store/internal";
import { storeToV1 } from "@latticexyz/store/config/v2";
import { Address, PublicClient } from "viem";
import { Store } from "tinybase/store";

export type AllTables<config extends StoreConfig, extraTables extends Tables | undefined> = ResolvedStoreConfig<
  storeToV1<config>
>["tables"] &
  (extraTables extends Tables ? extraTables : Record<never, never>) &
  typeof storeTables &
  typeof worldTables;

export type TinyBaseWrapperOptions<
  world extends World,
  config extends StoreConfig,
  networkConfig extends NetworkConfig,
  extraTables extends Tables | undefined,
> = {
  world: world;
  mudConfig: config;
  networkConfig: networkConfig;
  otherTables?: extraTables;
  publicClient?: PublicClient;
  onSync?: OnSyncCallbacks;
  extend?: boolean;
  startSync?: boolean;
};

export type TinyBaseWrapperResult<config extends StoreConfig, tables extends Tables | undefined> = {
  store: ComponentStore;
  tables: AllTables<config, tables>;
  publicClient: PublicClient;
  sync: Sync;
};

export interface NetworkConfig {
  chainId: number;
  chain: MUDChain;
  worldAddress: Address;
  initialBlockNumber: bigint;
  faucetServiceUrl?: string;
  indexerUrl?: string;
}

/* -------------------------------------------------------------------------- */
/*                                    STORE                                   */
/* -------------------------------------------------------------------------- */

export type CreateComponentStoreOptions<world extends World, config extends StoreConfig, tables extends Tables> = {
  world: world;
  tables: AllTables<config, tables>;
  extend: boolean;
};

export type CreateComponentStoreResult = {
  store: ComponentStore;
  storageAdapter: StorageAdapter;
};

export type ComponentStore = Store; // TODO: More precise store type with extended components

/* -------------------------------------------------------------------------- */
/*                                    SYNC                                    */
/* -------------------------------------------------------------------------- */

export type CreateSyncOptions<world extends World, tables extends Tables> = {
  world: world;
  tables: tables;
  networkConfig: NetworkConfig;
  publicClient: PublicClient;
  storageAdapter: StorageAdapter;
};

export type CreateSyncResult = Sync;

export type Sync = {
  start: (
    onProgress?: (index: number, blockNumber: bigint, progress: number) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error?: (err: any) => void,
  ) => void;
  unsubscribe: () => void;
};

export type OnSyncCallbacks = {
  progress: (index: number, blockNumber: bigint, progress: number) => void;
  complete: () => void;
  error: (err: any) => void;
};
