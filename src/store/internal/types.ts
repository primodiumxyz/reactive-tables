import { Metadata, Schema, ValueType } from "@latticexyz/recs";
import { Store as StoreConfig } from "@latticexyz/store";
import { Hex } from "viem";

import { OriginalComponentMethods } from "../component/types";

export type InternalComponents<tables extends InternalTables> = {
  [tableName in keyof tables]: InternalComponent<tables[tableName]>;
};

export type InternalComponent<
  table extends InternalTable,
  S extends Schema = Schema,
  M extends Metadata = Metadata,
  T = unknown,
> = InternalComponentTable<table, S, M> & InternalComponentMethods<table["schema"], T>;

export type InternalComponentTable<
  table extends InternalTable,
  S extends Schema = Schema,
  M extends Metadata = Metadata,
> = {
  id: string;
  schema: S & table["schema"];
  metadata: M & {
    componentName: table["name"];
    tableName: string;
  };
};

export type InternalComponentValue<S extends Schema, T = unknown> = {
  [key in keyof S]: ValueType<T>[S[key]];
};

export type InternalTables = {
  readonly [k: string]: InternalTable;
};

export type InternalTable = {
  id: Hex;
  readonly namespace: string;
  readonly name: string;
  schema: Schema;
};

export type InternalComponentMethods<S extends Schema, T = unknown> = OriginalComponentMethods<S, T> & {
  get(): InternalComponentValue<S> | undefined;
  get(defaultValue?: InternalComponentValue<S>): InternalComponentValue<S>;

  set: (value: InternalComponentValue<S, T>) => void;
  // getAll: () => Entity[];
  // getAllWith: (value: Partial<ComponentValue<S>>) => Entity[];
  // getAllWithout: (value: Partial<ComponentValue<S>>) => Entity[];
  // useAll: () => Entity[];
  // useAllWith: (value: Partial<ComponentValue<S>>) => Entity[];
  // useAllWithout: (value: Partial<ComponentValue<S>>) => Entity[];
  // remove: (entity?: Entity) => void;
  clear: () => void;
  update: (value: Partial<InternalComponentValue<S, T>>) => void;
  // has: (entity?: Entity) => boolean;

  use(): InternalComponentValue<S> | undefined;
  use(defaultValue?: InternalComponentValue<S>): InternalComponentValue<S>;

  pauseUpdates: (value?: InternalComponentValue<S, T>) => void;
  resumeUpdates: () => void;
};
