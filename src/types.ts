import { Schema, World } from "@latticexyz/recs";
import { Store as StoreConfig } from "@latticexyz/store";
import { storeTables, worldTables } from "@latticexyz/store-sync";
import { MUDChain } from "@latticexyz/common/chains";
import { ResolvedStoreConfig, Tables } from "@latticexyz/store/internal";
import { KeySchema, ValueSchema } from "@latticexyz/protocol-parser/internal";
import { storeToV1 } from "@latticexyz/store/config/v2";
import { Address, PublicClient } from "viem";
import { Store } from "tinybase/store";

import { Component, ExtendedComponentMethods } from "@/store/component/types";

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
  startSync?: boolean;
};

export type TinyBaseWrapperResult<config extends StoreConfig, tables extends Tables | undefined> = {
  components: Components<Schema, config, tables>;
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
// TODO: type key
export type Components<S extends Schema, config extends StoreConfig, tables extends Tables | undefined, T = unknown> = {
  [key in keyof tables]: Component<S, config, T>;
};

export type CreateComponentsStoreOptions<world extends World, config extends StoreConfig, tables extends Tables> = {
  world: world;
  tables: AllTables<config, tables>;
};

export type CreateComponentsStoreResult<config extends StoreConfig, tables extends Tables> = {
  components: Components<Schema, config, tables>;
  store: Store;
};

export type CreateComponentMethodsOptions = {
  store: Store;
  tableId: string;
  keySchema: KeySchema;
  valueSchema: ValueSchema;
  schema: Schema;
};

export type CreateComponentMethodsResult<S extends Schema, T = unknown> = ExtendedComponentMethods<S, T>;

export type CreateStoreOptions<config extends StoreConfig, tables extends Tables> = {
  tables: AllTables<config, tables>;
};

export type CreateStoreResult = Store;

/* -------------------------------------------------------------------------- */
/*                                    SYNC                                    */
/* -------------------------------------------------------------------------- */

export type CreateSyncOptions<world extends World, config extends StoreConfig, tables extends Tables> = {
  world: world;
  store: Store;
  networkConfig: NetworkConfig;
  publicClient: PublicClient;
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
