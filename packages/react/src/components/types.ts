import { Entity } from "@latticexyz/recs";
import { Store as StoreConfig } from "@latticexyz/store";
import { Hex } from "viem";

import { ContractTableMetadata } from "@/components/contract/types";
import { InternalTableMetadata } from "@/components/internal/types";
import { AllTables, Metadata, MUDTables, Schema, TinyBaseQueries, TinyBaseStore, ValueType } from "@/lib";

export type CreateContractComponentsOptions<config extends StoreConfig, extraTables extends MUDTables> = {
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

export type BaseTableMetadata<S extends Schema = Schema> = {
  readonly tableId: Hex;
  readonly namespace: string;
  readonly name: string;
  readonly schema: S;
};

// Used to infer the TypeScript types from the RECS types
export type ComponentValue<S extends Schema, T = unknown> = {
  [key in keyof S]: ValueType<T>[S[key]];
};

export type ComponentKey<S extends Schema, T = unknown> = {
  [key in keyof S]: ValueType<T>[S[key]];
};

// Used to infer the TypeScript types from the RECS types (excluding metadata)
export type ComponentValueSansMetadata<S extends Schema, T = unknown> = {
  [key in keyof S as Exclude<
    key,
    "__staticData" | "__encodedLengths" | "__dynamicData" | "__lastSyncedAtBlock"
  >]: ValueType<T>[S[key]];
};

export type OriginalComponentMethods = {
  entities: () => IterableIterator<Entity>;
};
