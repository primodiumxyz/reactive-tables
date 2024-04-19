import { Entity, Metadata, Schema, Type, ValueType } from "@latticexyz/recs";
import { Store as StoreConfig } from "@latticexyz/store";
import { ResourceLabel } from "@latticexyz/common";
import { SchemaAbiType } from "@latticexyz/schema-type/internal";
import { KeySchema, Table as MUDTable, ValueSchema } from "@latticexyz/store/internal";
import { storeToV1 } from "@latticexyz/store/config/v2";

import { SchemaAbiTypeToRecsType } from "@/store/utils";
import { CreateQueryResult, CreateQueryWrapperOptions } from "../queries";

export type Components<tables extends Tables, config extends StoreConfig> = {
  [tableName in keyof tables]: Component<tables[tableName], config>;
};

export type Component<
  table extends Table,
  config extends StoreConfig = StoreConfig,
  S extends Schema = Schema,
  M extends Metadata = Metadata,
  T = unknown,
> = ComponentTable<table, config, S, M> &
  ComponentMethods<GetSchema<table, S>, T> &
  (table["namespace"] extends "internal"
    ? {}
    : ContractComponentMethods<ContractValueSchema<table>, ContractKeySchema<table>, T>);

// Base component structure containing information about its table & schemas
export type ComponentTable<
  table extends Table,
  config extends StoreConfig,
  S extends Schema = Schema,
  M extends Metadata = Metadata,
> = {
  id: string;
  namespace: table["namespace"];
  schema: S & GetSchema<table>;
  metadata: M & {
    componentName: table["name"];
    tableName: ResourceLabel<storeToV1<config>["namespace"], string>;
    keySchema: table["namespace"] extends "internal"
      ? undefined
      : { [name in keyof table["keySchema"] & string]: table["keySchema"][name]["type"] };
    valueSchema: table["namespace"] extends "internal"
      ? undefined
      : { [name in keyof table["valueSchema"] & string]: table["valueSchema"][name]["type"] };
  };
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

export type ContractTable = BaseTable & {
  readonly namespace: "contract";
  readonly keySchema: KeySchema;
  readonly valueSchema: ValueSchema;
};
export type ContractTables = {
  readonly [k: string]: ContractTable;
};

export type InternalTable = BaseTable & {
  readonly namespace: "internal";
};
export type InternalTables = {
  readonly [k: string]: InternalTable;
};

export type BaseTable = {
  readonly namespace: string;
  readonly tableId: string;
  readonly name: string;
  readonly schema: Schema;
};

export type Table = ContractTable | InternalTable;
export type Tables = {
  readonly [k: string]: Table;
};

export type GetSchema<table extends Table, S extends Schema = Schema> = S &
  (table["namespace"] extends "internal"
    ? // TODO: fix this as TypeScript doesn't trust us + extends InternalTable/ContractTable doesn't work
      table["schema"]
    : ContractValueSchema<table>);

// Used to infer the RECS types from the component's value schema
export type ContractValueSchema<table extends ContractTable, S extends Schema = Schema> = S & {
  [fieldName in keyof table["valueSchema"] & string]: Type &
    SchemaAbiTypeToRecsType<SchemaAbiType & table["valueSchema"][fieldName]["type"]>;
} & {
  __staticData: Type.OptionalString;
  __encodedLengths: Type.OptionalString;
  __dynamicData: Type.OptionalString;
  __lastSyncedAtBlock: Type.OptionalBigInt;
};

export type ContractKeySchema<table extends ContractTable, S extends Schema = Schema> = S & {
  [fieldName in keyof table["keySchema"] & string]: Type &
    SchemaAbiTypeToRecsType<SchemaAbiType & table["keySchema"][fieldName]["type"]>;
};

// We pass the table to be able to infer if it's a contract or internal table (e.g. the latter won't contain metadata values)
export type ComponentMethods<S extends Schema, T = unknown> = OriginalComponentMethods & {
  get(): ComponentValue<S, T> | undefined;
  get(entity: Entity | undefined): ComponentValue<S, T> | undefined;
  get(entity?: Entity | undefined, defaultValue?: ComponentValueSansMetadata<S, T>): ComponentValue<S, T>;

  set: (value: ComponentValueSansMetadata<S, T> | ComponentValue<S, T>, entity?: Entity) => void;
  getAll: () => Entity[];
  getAllWith: (value: Partial<ComponentValue<S, T>>) => Entity[];
  getAllWithout: (value: Partial<ComponentValue<S, T>>) => Entity[];
  useAll: () => Entity[];
  useAllWith: (value: Partial<ComponentValue<S, T>>) => Entity[];
  useAllWithout: (value: Partial<ComponentValue<S, T>>) => Entity[];
  remove: (entity?: Entity) => void;
  clear: () => void;
  update: (value: Partial<ComponentValue<S, T>>, entity?: Entity) => void;
  has: (entity?: Entity) => boolean;

  use(entity?: Entity | undefined): ComponentValue<S, T> | undefined;
  use(entity: Entity | undefined, defaultValue?: ComponentValueSansMetadata<S, T>): ComponentValue<S, T>;

  pauseUpdates: (entity?: Entity, value?: ComponentValueSansMetadata<S, T>) => void;
  resumeUpdates: (entity?: Entity) => void;

  createQuery: (options: CreateQueryWrapperOptions<S, T>) => CreateQueryResult;
};

export type ContractComponentMethods<VS extends Schema = Schema, KS extends Schema = Schema, T = unknown> = {
  getWithKeys(): ComponentValue<VS, T> | undefined;
  getWithKeys(keys?: ComponentKey<KS, T>): ComponentValue<VS, T> | undefined;
  getWithKeys(keys?: ComponentKey<KS, T>, defaultValue?: ComponentValueSansMetadata<VS, T>): ComponentValue<VS, T>;

  hasWithKeys: (keys?: ComponentKey<KS, T>) => boolean;

  useWithKeys(keys?: ComponentKey<KS, T>): ComponentValue<VS, T> | undefined;
  useWithKeys(keys?: ComponentKey<KS, T>, defaultValue?: ComponentValueSansMetadata<VS, T>): ComponentValue<VS>;

  setWithKeys(value: ComponentValue<VS, T>, keys?: ComponentKey<KS, T>): void;

  getEntityKeys: (entity: Entity) => ComponentKey<KS, T>;
};

export type OriginalComponentMethods = {
  entities: () => IterableIterator<Entity>;
};
