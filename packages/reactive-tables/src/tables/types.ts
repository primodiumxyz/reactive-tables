import type { Hex } from "viem";

import type { ContractTableMetadata } from "@/tables/contract";
import type { LocalTableMetadata } from "@/tables/local";
import type {
  AllTableDefs,
  Metadata,
  ContractTableDefs,
  $Record,
  Schema,
  TinyBaseQueries,
  TinyBaseStore,
  PropertiesType,
  StoreConfig,
} from "@/lib";

export type CreateContractTablesOptions<
  config extends StoreConfig,
  extraTableDefs extends ContractTableDefs | undefined,
> = {
  tableDefs: AllTableDefs<config, extraTableDefs>;
  store: TinyBaseStore;
  queries: TinyBaseQueries;
};

export type CreateTableMethodsOptions<
  S extends Schema,
  M extends Metadata,
  metadata extends LocalTableMetadata<S, M> | ContractTableMetadata<S, M>,
> = {
  store: TinyBaseStore;
  queries: TinyBaseQueries;
  metadata: metadata;
};

export type BaseTableMetadata<S extends Schema = Schema> = {
  readonly tableId: Hex;
  readonly namespace: string;
  readonly name: string;
  readonly schema: S;
};

// Used to infer the TypeScript types from the RECS types
export type Properties<S extends Schema, T = unknown> = {
  [key in keyof S]: PropertiesType<T>[S[key]];
};

// Used to infer the TypeScript types from the RECS types (excluding metadata)
export type PropertiesSansMetadata<S extends Schema, T = unknown> = {
  [key in keyof S as Exclude<
    key,
    "__staticData" | "__encodedLengths" | "__dynamicData" | "__lastSyncedAtBlock"
  >]: PropertiesType<T>[S[key]];
};

export type OriginalTableMethods = {
  $records: () => IterableIterator<$Record>;
};
