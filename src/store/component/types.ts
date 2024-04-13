import { Entity, Metadata, Schema, Type, ValueType } from "@latticexyz/recs";
import { Store as StoreConfig } from "@latticexyz/store";
import { ResourceLabel } from "@latticexyz/common";
import { Table, Tables } from "@latticexyz/store/internal";
import { SchemaAbiTypeToRecsType } from "@/utils";
import { SchemaAbiType } from "@latticexyz/schema-type/internal";
import { storeToV1 } from "@latticexyz/store/config/v2";
import { Hex } from "viem";

export type Components<tables extends Tables, config extends StoreConfig> = {
  [tableName in keyof tables]: Component<tables[tableName], config>;
};

export type Component<
  table extends Table,
  config extends StoreConfig,
  S extends Schema = Schema,
  M extends Metadata = Metadata,
  T = unknown,
> = ComponentTable<table, config, S, M> & ComponentMethods<table, ComponentValueSchema<table, S>, T>;

// Base component structure containing information about its table & schemas
export type ComponentTable<
  table extends Table,
  config extends StoreConfig,
  S extends Schema = Schema,
  M extends Metadata = Metadata,
> = {
  id: string;
  // schema: ComponentValueSchema<table, S>;
  metadata: M & {
    componentName: table["name"];
    tableName: ResourceLabel<storeToV1<config>["namespace"], string>;
    keySchema: { [name in keyof table["keySchema"] & string]: table["keySchema"][name]["type"] };
    valueSchema: { [name in keyof table["valueSchema"] & string]: table["valueSchema"][name]["type"] };
  };
};

export type ComponentValueSchema<table extends Table, S extends Schema = Schema> = S & {
  __staticData: ComponentValue<S, Type.OptionalString>;
  __encodedLengths: ComponentValue<S, Type.OptionalString>;
  __dynamicData: ComponentValue<S, Type.OptionalString>;
} & {
  [fieldName in keyof table["valueSchema"] & string]: Type &
    SchemaAbiTypeToRecsType<SchemaAbiType & table["valueSchema"][fieldName]["type"]>;
};

export type ComponentValue<S extends Schema, T = unknown> = {
  [key in keyof S]: ValueType<T>[S[key]];
} & {
  __staticData: Hex | undefined;
  __encodedLengths: Hex | undefined;
  __dynamicData: Hex | undefined;
};

// Copied from Primodium
export type ComponentValueSansMetadata<S extends Schema, T = unknown> = {
  [key in keyof S as Exclude<key, "__staticData" | "__encodedLengths" | "__dynamicData">]: ValueType<T>[S[key]];
} & {
  __staticData?: Hex;
  __encodedLengths?: Hex;
  __dynamicData?: Hex;
};

export type ComponentMethods<table extends Table, S extends Schema, T = unknown> = {
  get(): ComponentValue<S> | undefined;
  get(entity: Entity | undefined): ComponentValue<S> | undefined;
  get(entity?: Entity | undefined, defaultValue?: ComponentValueSansMetadata<S>): ComponentValue<S>;

  set: (value: ComponentValueSansMetadata<S>, entity?: Entity) => void;
  // getAll: () => Entity[];
  // getAllWith: (value: Partial<ComponentValue<S>>) => Entity[];
  // getAllWithout: (value: Partial<ComponentValue<S>>) => Entity[];
  // useAll: () => Entity[];
  // useAllWith: (value: Partial<ComponentValue<S>>) => Entity[];
  // useAllWithout: (value: Partial<ComponentValue<S>>) => Entity[];
  // remove: (entity?: Entity) => void;
  // clear: () => void;
  // update: (value: Partial<ComponentValue<S, T>>, entity?: Entity) => void;
  // has: (entity?: Entity) => boolean;

  // use(entity?: Entity | undefined): ComponentValue<S> | undefined;
  // use(entity: Entity | undefined, defaultValue?: ComponentValueSansMetadata<S>): ComponentValue<S>;

  // pauseUpdates: (entity: Entity, value?: ComponentValue<S, T>, skipUpdateStream?: boolean) => void;
  // resumeUpdates: (entity: Entity, skipUpdateStream?: boolean) => void;
};

// export type ExtendedContractComponentMethods<
//   S extends Schema = Schema,
//   TKeySchema extends KeySchema = KeySchema,
// > = ComponentMethods<S, unknown> & {
//   getWithKeys(): ComponentValue<S> | undefined;
//   getWithKeys(keys?: SchemaToPrimitives<TKeySchema>): ComponentValue<S> | undefined;
//   getWithKeys(keys?: SchemaToPrimitives<TKeySchema>, defaultValue?: ComponentValueSansMetadata<S>): ComponentValue<S>;

//   hasWithKeys: (keys?: SchemaToPrimitives<TKeySchema>) => boolean;

//   useWithKeys(keys?: SchemaToPrimitives<TKeySchema>): ComponentValue<S> | undefined;
//   useWithKeys(keys?: SchemaToPrimitives<TKeySchema>, defaultValue?: ComponentValueSansMetadata<S>): ComponentValue<S>;

//   setWithKeys(value: ComponentValue<S>, keys?: SchemaToPrimitives<TKeySchema>): void;

//   getEntityKeys: (entity: Entity) => SchemaToPrimitives<TKeySchema>;
// };

// export type OriginalComponentMethods<S extends Schema, T = unknown> = {
//   update$: Subject<ComponentUpdate<S, T>> & { observers: any };
//   entities: () => IterableIterator<Entity>; // ???
// }
