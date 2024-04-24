import { Schema } from "@latticexyz/recs";
import { Store as StoreConfig } from "@latticexyz/store";
import { ResolvedStoreConfig, Tables as MUDTables } from "@latticexyz/store/internal";
import { storeToV1 } from "@latticexyz/store/config/v2";
import { Store } from "tinybase/store";
import { Queries } from "tinybase/queries";

import { ContractTableMetadata, ContractTables } from "@/components/contract/types";
import { InternalTableMetadata } from "@/components/internal/types";
import { Metadata } from "@/components/types";
import { StorageAdapter } from "@/adapter";

import { storeTables, worldTables } from "@/index";

// Ease integration as these are returned from the main entry point
export type TinyBaseStore = Store;
export type TinyBaseQueries = Queries;

export type AllTables<config extends StoreConfig, extraTables extends MUDTables> = ResolvedStoreConfig<
  storeToV1<config>
>["tables"] &
  (extraTables extends MUDTables ? extraTables : Record<string, never>) &
  typeof storeTables &
  typeof worldTables;

export type TinyBaseWrapperOptions<config extends StoreConfig, extraTables extends MUDTables> = {
  mudConfig: config;
  otherTables?: extraTables;
};

export type TinyBaseWrapperResult<config extends StoreConfig, tables extends MUDTables> = {
  components: ContractTables<AllTables<config, tables>>;
  tables: AllTables<config, tables>;
  store: TinyBaseStore;
  queries: TinyBaseQueries;
  storageAdapter: StorageAdapter;
};

/* -------------------------------------------------------------------------- */
/*                                    STORE                                   */
/* -------------------------------------------------------------------------- */
export type CreateComponentsStoreOptions<config extends StoreConfig, extraTables extends MUDTables> = {
  tables: AllTables<config, extraTables>;
  store: TinyBaseStore;
  queries: TinyBaseQueries;
};

export type CreateComponentMethodsOptions<
  S extends Schema,
  M extends Metadata,
  metadata extends InternalTableMetadata<S, M> | ContractTableMetadata<S, M>,
> = {
  store: TinyBaseStore;
  queries: TinyBaseQueries;
  metadata: metadata;
};

export type CreateStoreOptions<config extends StoreConfig, tables extends MUDTables> = {
  tables: AllTables<config, tables>;
};

export type CreateStoreResult = TinyBaseStore;
