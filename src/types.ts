import { Schema, World } from "@latticexyz/recs";
import { Store as StoreConfig } from "@latticexyz/store";
import { MUDChain } from "@latticexyz/common/chains";
import { ResolvedStoreConfig, Table as MUDTable, Tables as MUDTables } from "@latticexyz/store/internal";
import { storeToV1 } from "@latticexyz/store/config/v2";
import { KeySchema } from "@latticexyz/protocol-parser/internal";
import { Address, PublicClient } from "viem";
import { Store } from "tinybase/store";
import { Queries } from "tinybase/queries";

import { Components, ComponentMethods, Table, Tables, ContractComponentMethods } from "@/store/component/types";
import { internalComponentsTables } from "./store/internal/internalComponents";

import { storeTables, worldTables } from "@latticexyz/store-sync";

export type AllTables<config extends StoreConfig, extraTables extends Tables | undefined> = ResolvedStoreConfig<
  storeToV1<config>
>["tables"] &
  (extraTables extends Tables ? extraTables : {}) &
  typeof storeTables &
  typeof worldTables &
  typeof internalComponentsTables;

export type AllComponents<config extends StoreConfig, tables extends Tables | undefined> = Components<
  AllTables<config, tables>,
  config
>;

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
  components: AllComponents<config, tables>;
  tables: AllTables<config, tables>;
  store: Store;
  queries: Queries;
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
};

export type CreateComponentsStoreResult<config extends StoreConfig, extraTables extends Tables | undefined> = {
  components: AllComponents<config, extraTables>;
  store: Store;
  queries: Queries;
};

export type CreateComponentMethodsOptions<table extends Table> = {
  store: Store;
  queries: Queries;
  table: table;
  tableId: string;
  keySchema: KeySchema;
};

export type CreateComponentMethodsResult<VS extends Schema, KS extends Schema = Schema, T = unknown> =
  | ComponentMethods<VS, T>
  | (ComponentMethods<VS, T> & ContractComponentMethods<VS, KS, T>);

export type CreateStoreOptions<config extends StoreConfig, tables extends Tables> = {
  tables: AllTables<config, tables>;
};

export type CreateStoreResult = Store;

/* -------------------------------------------------------------------------- */
/*                                    SYNC                                    */
/* -------------------------------------------------------------------------- */

export type CreateSyncOptions<config extends StoreConfig, extraTables extends Tables | undefined> = {
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
    error?: (err: any) => void,
  ) => void;
  unsubscribe: () => void;
};

export type OnSyncCallbacks = {
  progress: (index: number, blockNumber: bigint, progress: number) => void;
  complete: (blockNumber?: bigint) => void;
  error: (err: any) => void;
};
