import { Schema, World } from "@latticexyz/recs";
import { Store as StoreConfig } from "@latticexyz/store";
import { KeySchema } from "@latticexyz/store/internal";
import { storeTables, worldTables } from "@latticexyz/store-sync";
import { MUDChain } from "@latticexyz/common/chains";
import { ResolvedStoreConfig, Tables as MUDTables } from "@latticexyz/store/internal";
import { storeToV1 } from "@latticexyz/store/config/v2";
import { Address, PublicClient } from "viem";
import { Store } from "tinybase/store";
import { Queries } from "tinybase/queries";

import { Components, ComponentMethods, Table, Tables, ContractComponentMethods } from "@/store/component/types";
import { StorageAdapter } from "@/adapter";

export type ExtraTables = Tables | MUDTables | undefined;
export type AllTables<config extends StoreConfig, extraTables extends ExtraTables> = ResolvedStoreConfig<
  storeToV1<config>
>["tables"] &
  (extraTables extends Tables ? extraTables : {}) &
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
  store: Store;
  queries: Queries;
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

export type CreateStoreOptions<config extends StoreConfig, tables extends ExtraTables> = {
  tables: AllTables<config, tables>;
};

export type CreateStoreResult = Store;
