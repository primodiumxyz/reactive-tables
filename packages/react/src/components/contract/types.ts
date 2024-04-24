import { Entity } from "@latticexyz/recs";
import { SchemaAbiType } from "@latticexyz/schema-type/internal";
import { KeySchema, Table as MUDTable, ValueSchema } from "@latticexyz/store/internal";
import { KeySchema as ParsedKeySchema, ValueSchema as ParsedValueSchema } from "@latticexyz/protocol-parser/internal";

import { CreateQueryResult, CreateQueryWrapperOptions } from "@/queries";
import { SchemaAbiTypeToRecsType } from "@/components/utils";
import {
  BaseTableMetadata,
  ComponentKey,
  ComponentValue,
  ComponentValueSansMetadata,
  MUDTables,
  Metadata,
  OriginalComponentMethods,
  Schema,
  Type,
} from "@/components/types";

export type ContractTables<tables extends MUDTables> = {
  [tableName in keyof tables]: ContractTable<tables[tableName]>;
};

export type ContractTable<
  table extends MUDTable,
  S extends Schema = Schema,
  M extends Metadata = Metadata,
  T = unknown,
> = ContractTableMethods<AbiToSchemaPlusMetadata<table["valueSchema"]>, T> &
  ContractTableWithKeysMethods<AbiToSchemaPlusMetadata<table["valueSchema"]>, AbiToSchema<table["keySchema"]>, T> & {
    readonly id: table["tableId"];
    readonly schema: S;
    readonly metadata: M & {
      readonly componentName: table["name"];
      readonly tableName: `${table["namespace"]}__${table["name"]}`;
      readonly keySchema: table["keySchema"];
      readonly valueSchema: table["valueSchema"];
    };
  };

export type ContractTableMetadata<S extends Schema, M extends Metadata = Metadata> = M &
  BaseTableMetadata<S> & {
    readonly keySchema: ParsedKeySchema;
    readonly valueSchema: ParsedValueSchema;
  };

// Used to infer the RECS types from the component's key/value schema (abi)
export type AbiToSchema<schema extends ValueSchema | KeySchema | ParsedValueSchema | ParsedKeySchema> = {
  [fieldName in keyof schema & string]: SchemaAbiTypeToRecsType<
    SchemaAbiType & (schema extends ValueSchema | KeySchema ? schema[fieldName]["type"] : schema[fieldName])
  >;
};

export type AbiToSchemaPlusMetadata<schema extends ValueSchema> = AbiToSchema<schema> & {
  __staticData: Type.OptionalString;
  __encodedLengths: Type.OptionalString;
  __dynamicData: Type.OptionalString;
  __lastSyncedAtBlock: Type.OptionalBigInt;
};

// We pass the table to be able to infer if it's a contract or internal table (e.g. the latter won't contain metadata values)
export type ContractTableMethods<VS extends Schema, T = unknown> = OriginalComponentMethods & {
  get(): ComponentValue<VS, T> | undefined;
  get(entity: Entity | undefined): ComponentValue<VS, T> | undefined;
  get(entity?: Entity | undefined, defaultValue?: ComponentValueSansMetadata<VS, T>): ComponentValue<VS, T>;

  set: (value: ComponentValue<VS, T>, entity?: Entity) => void;
  getAll: () => Entity[];
  getAllWith: (value: Partial<ComponentValue<VS, T>>) => Entity[];
  getAllWithout: (value: Partial<ComponentValue<VS, T>>) => Entity[];
  useAll: () => Entity[];
  useAllWith: (value: Partial<ComponentValue<VS, T>>) => Entity[];
  useAllWithout: (value: Partial<ComponentValue<VS, T>>) => Entity[];
  remove: (entity?: Entity) => void;
  clear: () => void;
  update: (value: Partial<ComponentValue<VS, T>>, entity?: Entity) => void;
  has: (entity?: Entity) => boolean;

  use(entity?: Entity | undefined): ComponentValue<VS, T> | undefined;
  use(entity: Entity | undefined, defaultValue?: ComponentValueSansMetadata<VS, T>): ComponentValue<VS, T>;

  pauseUpdates: (entity?: Entity, value?: ComponentValue<VS, T>) => void;
  resumeUpdates: (entity?: Entity) => void;

  createQuery: (options: Omit<CreateQueryWrapperOptions<VS, T>, "queries" | "tableId" | "schema">) => CreateQueryResult;
};

export type ContractTableWithKeysMethods<VS extends Schema, KS extends Schema, T = unknown> = {
  getWithKeys(): ComponentValue<VS, T> | undefined;
  getWithKeys(keys?: ComponentKey<KS, T>): ComponentValue<VS, T> | undefined;
  getWithKeys(keys?: ComponentKey<KS, T>, defaultValue?: ComponentValueSansMetadata<VS, T>): ComponentValue<VS, T>;

  hasWithKeys: (keys?: ComponentKey<KS, T>) => boolean;

  useWithKeys(keys?: ComponentKey<KS, T>): ComponentValue<VS, T> | undefined;
  useWithKeys(keys?: ComponentKey<KS, T>, defaultValue?: ComponentValueSansMetadata<VS, T>): ComponentValue<VS>;

  setWithKeys(value: ComponentValue<VS, T>, keys?: ComponentKey<KS, T>): void;

  getEntityKeys: (entity: Entity) => ComponentKey<KS, T>;
};
