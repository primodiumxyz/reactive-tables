import { Hex } from "viem";

import { ContractTableMetadata } from "@/tables/contract";
import { LocalTableMetadata } from "@/tables/local";
import {
  AllTableDefs,
  Metadata,
  ContractTableDefs,
  $Record,
  Schema,
  TinyBaseQueries,
  TinyBaseStore,
  PropsType,
  StoreConfig,
} from "@/lib";

export type CreateContractTablesOptions<config extends StoreConfig, extraTableDefs extends ContractTableDefs> = {
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
  [key in keyof S]: PropsType<T>[S[key]];
};

// Used to infer the TypeScript types from the RECS types (excluding metadata)
export type PropertiesSansMetadata<S extends Schema, T = unknown> = {
  [key in keyof S as Exclude<
    key,
    "__staticData" | "__encodedLengths" | "__dynamicData" | "__lastSyncedAtBlock"
  >]: PropsType<T>[S[key]];
};

export type OriginalTableMethods = {
  $records: () => IterableIterator<$Record>;
};
