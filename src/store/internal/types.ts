import { Metadata, Schema, ValueType } from "@latticexyz/recs";

import { Hex } from "viem";

export type InternalComponents<tables extends InternalTables> = {
  [tableName in keyof tables]: InternalComponent<tables[tableName]>;
};

export type InternalComponent<
  table extends InternalTable,
  S extends Schema = Schema,
  M extends Metadata = Metadata,
> = InternalComponentTable<table, S, M> & InternalComponentMethods<table["schema"]>;

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

export type InternalComponentMethods<S extends Schema, T = unknown> = {
  get(): InternalComponentValue<S, T> | undefined;
  get(defaultValue?: InternalComponentValue<S, T>): InternalComponentValue<S, T>;

  set: (value: InternalComponentValue<S, T>) => void;
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
