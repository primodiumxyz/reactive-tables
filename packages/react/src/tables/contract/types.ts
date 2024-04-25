import { SchemaAbiType } from "@latticexyz/schema-type/internal";
import { KeySchema as UnparsedKeySchema, ValueSchema as UnparsedPropsSchema } from "@latticexyz/store/internal";
import { KeySchema, ValueSchema as PropsSchema } from "@latticexyz/protocol-parser/internal";

import { CreateQueryResult, CreateQueryWrapperOptions } from "@/queries";
import { BaseTableMetadata, OriginalTableMethods, Properties, PropertiesSansMetadata } from "@/tables";
import { ContractTableDef, ContractTableDefs, Metadata, $Record, Schema, SchemaAbiTypeToRecsType, Type } from "@/lib";

export { UnparsedKeySchema, KeySchema, UnparsedPropsSchema, PropsSchema };

export type ContractTables<tableDefs extends ContractTableDefs> = {
  [tableName in keyof tableDefs]: ContractTable<tableDefs[tableName]>;
};

export type ContractTable<
  tableDef extends ContractTableDef,
  S extends Schema = Schema,
  M extends Metadata = Metadata,
  T = unknown,
> = ContractTableMethods<AbiToSchemaPlusMetadata<tableDef["valueSchema"]>, T> &
  ContractTableWithKeysMethods<
    AbiToSchemaPlusMetadata<tableDef["valueSchema"]>,
    AbiToSchema<tableDef["keySchema"]>,
    T
  > & {
    readonly id: tableDef["tableId"];
    readonly schema: S;
    readonly metadata: M & {
      readonly name: tableDef["name"];
      readonly globalName: `${tableDef["namespace"]}__${tableDef["name"]}`;
      readonly keySchema: tableDef["keySchema"];
      readonly propsSchema: tableDef["valueSchema"];
    };
  };

export type ContractTableMetadata<S extends Schema, M extends Metadata = Metadata> = M &
  BaseTableMetadata<S> & {
    readonly keySchema: KeySchema;
    readonly propsSchema: PropsSchema;
  };

// Used to infer the RECS types from the table's key/properties schema (abi)
export type AbiToSchema<schema extends UnparsedPropsSchema | UnparsedKeySchema | PropsSchema | KeySchema> = {
  [fieldName in keyof schema & string]: SchemaAbiTypeToRecsType<
    SchemaAbiType &
      (schema extends UnparsedPropsSchema | UnparsedKeySchema ? schema[fieldName]["type"] : schema[fieldName])
  >;
};

export type AbiToSchemaPlusMetadata<schema extends UnparsedPropsSchema> = AbiToSchema<schema> & {
  __staticData: Type.OptionalString;
  __encodedLengths: Type.OptionalString;
  __dynamicData: Type.OptionalString;
  __lastSyncedAtBlock: Type.OptionalBigInt;
};

// We pass the table to be able to infer if it's a contract or internal table (e.g. the latter won't contain metadata properties)
export type ContractTableMethods<VS extends Schema, T = unknown> = OriginalTableMethods & {
  get(): Properties<VS, T> | undefined;
  get($record: $Record | undefined): Properties<VS, T> | undefined;
  get($record?: $Record | undefined, defaultProps?: PropertiesSansMetadata<VS, T>): Properties<VS, T>;

  set: (properties: Properties<VS, T>, $record?: $Record) => void;
  getAll: () => $Record[];
  getAllWith: (properties: Partial<Properties<VS, T>>) => $Record[];
  getAllWithout: (properties: Partial<Properties<VS, T>>) => $Record[];
  useAll: () => $Record[];
  useAllWith: (properties: Partial<Properties<VS, T>>) => $Record[];
  useAllWithout: (properties: Partial<Properties<VS, T>>) => $Record[];
  remove: ($record?: $Record) => void;
  clear: () => void;
  update: (properties: Partial<Properties<VS, T>>, $record?: $Record) => void;
  has: ($record?: $Record) => boolean;

  use($record?: $Record | undefined): Properties<VS, T> | undefined;
  use($record: $Record | undefined, defaultProps?: PropertiesSansMetadata<VS, T>): Properties<VS, T>;

  pauseUpdates: ($record?: $Record, properties?: Properties<VS, T>) => void;
  resumeUpdates: ($record?: $Record) => void;

  createQuery: (options: Omit<CreateQueryWrapperOptions<VS, T>, "queries" | "tableId" | "schema">) => CreateQueryResult;
};

export type ContractTableWithKeysMethods<VS extends Schema, KS extends Schema, T = unknown> = {
  getWithKeys(): Properties<VS, T> | undefined;
  getWithKeys(keys?: Properties<KS, T>): Properties<VS, T> | undefined;
  getWithKeys(keys?: Properties<KS, T>, defaultProps?: PropertiesSansMetadata<VS, T>): Properties<VS, T>;

  hasWithKeys: (keys?: Properties<KS, T>) => boolean;

  useWithKeys(keys?: Properties<KS, T>): Properties<VS, T> | undefined;
  useWithKeys(keys?: Properties<KS, T>, defaultProps?: PropertiesSansMetadata<VS, T>): Properties<VS>;

  setWithKeys(properties: Properties<VS, T>, keys?: Properties<KS, T>): void;

  get$RecordKeys: ($record: $Record) => Properties<KS, T>;
};
