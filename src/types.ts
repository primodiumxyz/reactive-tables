import { Schema, World } from "@latticexyz/recs";
import { Store as StoreConfig } from "@latticexyz/store";
import { MUDChain } from "@latticexyz/common/chains";
import { ResolvedStoreConfig, Tables } from "@latticexyz/store/internal";
import { storeToV1 } from "@latticexyz/store/config/v2";
import { Address, PublicClient } from "viem";
import { Store } from "tinybase/store";

import { Components, ExtendedComponentMethods } from "@/store/component/types";

import { storeTables, worldTables } from "@latticexyz/store-sync";
import { internalTables } from "@/constants";

export type AllTables<config extends StoreConfig, extraTables extends Tables | undefined> = ResolvedStoreConfig<
  storeToV1<config>
>["tables"] &
  (extraTables extends Tables ? extraTables : {}) &
  typeof storeTables &
  typeof worldTables &
  typeof internalTables;

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
  startSync?: boolean;
};

export type TinyBaseWrapperResult<config extends StoreConfig, tables extends Tables | undefined> = {
  components: Components<AllTables<config, tables>, config>;
  tables: AllTables<config, tables>;
  store: Store;
  sync: CreateSyncResult;
  publicClient: PublicClient;
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
export type CreateComponentsStoreOptions<
  world extends World,
  config extends StoreConfig,
  extraTables extends Tables | undefined,
> = {
  world: world;
  tables: AllTables<config, extraTables>;
  extraTables?: extraTables;
};

export type CreateComponentsStoreResult<config extends StoreConfig, extraTables extends Tables | undefined> = {
  components: Components<AllTables<config, extraTables>, config>;
  store: Store;
};

export type CreateComponentMethodsOptions = {
  store: Store;
  tableId: string;
};

export type CreateComponentMethodsResult<S extends Schema, T = unknown> = ExtendedComponentMethods<S, T>;

export type CreateStoreOptions<config extends StoreConfig, tables extends Tables> = {
  tables: AllTables<config, tables>;
};

export type CreateStoreResult = Store;

/* -------------------------------------------------------------------------- */
/*                                    SYNC                                    */
/* -------------------------------------------------------------------------- */

export type CreateSyncOptions<config extends StoreConfig, extraTables extends Tables | undefined> = {
  components: Components<AllTables<config, extraTables>, config>;
  store: Store;
  networkConfig: NetworkConfig;
  publicClient: PublicClient;
  onSync: OnSyncCallbacks;
};

export type CreateSyncResult = {
  start: () => void;
  unsubscribe: () => void;
};

export type CreateIndexerSyncOptions<config extends StoreConfig, extraTables extends Tables | undefined> = Omit<
  CreateSyncOptions<config, extraTables>,
  "components" | "publicClient" | "onSync"
> & {
  logFilters: { tableId: string }[];
};

export type CreateRpcSyncOptions<config extends StoreConfig, extraTables extends Tables | undefined> = Omit<
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error?: (err: any) => void,
  ) => void;
  unsubscribe: () => void;
  // it can be undefined if key is indexer
};

export type OnSyncCallbacks = {
  progress: (index: number, blockNumber: bigint, progress: number) => void;
  complete: (blockNumber?: bigint) => void;
  error: (err: any) => void;
};
