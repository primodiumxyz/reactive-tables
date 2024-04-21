import { Schema, World } from "@latticexyz/recs";
import { Store as StoreConfig } from "@latticexyz/store";
import { MUDChain } from "@latticexyz/common/chains";
import { ResolvedStoreConfig, Tables as MUDTables } from "@latticexyz/store/internal";
import { storeToV1 } from "@latticexyz/store/config/v2";
import { Address, PublicClient } from "viem";
import { Store } from "tinybase/store";
import { Queries } from "tinybase/queries";

// Ease integration as these are returned from the main entry point
export type TinyBaseStore = Store;
export type TinyBaseQueries = Queries;

import {
  Components,
  ComponentMethods,
  Table,
  Tables,
  ContractComponentMethods,
  ContractTables,
} from "@/store/component/types";
import { StorageAdapter } from "@/adapter";

import { storeTables, worldTables } from "@/index";

export type ExtraTables = ContractTables | MUDTables | undefined;
export type AllTables<config extends StoreConfig, extraTables extends ExtraTables> = ResolvedStoreConfig<
  storeToV1<config>
>["tables"] &
  (extraTables extends Tables ? extraTables : Record<string, never>) &
  typeof storeTables &
  typeof worldTables;

export type AllComponents<config extends StoreConfig, tables extends ExtraTables> = Components<
  AllTables<config, tables>,
  config
>;

export type TinyBaseWrapperOptions<
  world extends World,
  config extends StoreConfig,
  networkConfig extends NetworkConfig,
  extraTables extends ExtraTables,
> = {
  world: world;
  mudConfig: config;
  networkConfig: networkConfig;
  otherTables?: extraTables;
  publicClient?: PublicClient;
};

export type TinyBaseWrapperResult<config extends StoreConfig, tables extends ExtraTables> = {
  components: AllComponents<config, tables>;
  tables: AllTables<config, tables>;
  store: TinyBaseStore;
  queries: TinyBaseQueries;
  storageAdapter: StorageAdapter;
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
  extraTables extends ExtraTables,
> = {
  world: world;
  tables: AllTables<config, extraTables>;
};

export type CreateComponentsStoreResult<config extends StoreConfig, extraTables extends ExtraTables> = {
  components: AllComponents<config, extraTables>;
  store: TinyBaseStore;
  queries: TinyBaseQueries;
};

export type CreateComponentMethodsOptions<table extends Table> = {
  store: TinyBaseStore;
  queries: TinyBaseQueries;
  table: table;
  tableId: string;
};

export type CreateComponentMethodsResult<VS extends Schema, KS extends Schema = Schema, T = unknown> =
  | ComponentMethods<VS, T>
  | (ComponentMethods<VS, T> & ContractComponentMethods<VS, KS, T>);

export type CreateStoreOptions<config extends StoreConfig, tables extends ExtraTables> = {
  tables: AllTables<config, tables>;
};

export type CreateStoreResult = TinyBaseStore;