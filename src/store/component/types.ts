import { ComponentValue, Entity, Schema } from "@latticexyz/recs";
import { Store as StoreConfig } from "@latticexyz/store";
import { ResourceLabel } from "@latticexyz/common";
import { KeySchema, ValueSchema } from "@latticexyz/protocol-parser/internal";
import { storeToV1 } from "@latticexyz/store/config/v2";

// TODO: figure out if we need Schema & StoreConfig
export type Component<S extends Schema, config extends StoreConfig, T = unknown> = BaseComponent<S, config> &
  ExtendedComponentMethods<S, T>;

export type BaseComponent<S, config> = {
  schema: S;
  metadata: {
    id: string;
    componentName: string;
    tableName: ResourceLabel<storeToV1<config>["namespace"], string>;
  };
  keySchema: KeySchema;
  valueSchema: ValueSchema;
};

// Copied from Primodium
export type ValueSansMetadata<S extends Schema> = Omit<
  ComponentValue<S>,
  "__staticData" | "__encodedLengths" | "__dynamicData"
>;

export type ExtendedComponentMethods<S extends Schema, T = unknown> = {
  get(): ComponentValue<S> | undefined;
  get(entity: Entity | undefined): ComponentValue<S> | undefined;
  get(entity?: Entity | undefined, defaultValue?: ValueSansMetadata<S>): ComponentValue<S>;

  set: (value: ComponentValue<S, T>, entity?: Entity) => void;
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
  // use(entity: Entity | undefined, defaultValue?: ValueSansMetadata<S>): ComponentValue<S>;

  // pauseUpdates: (entity: Entity, value?: ComponentValue<S, T>, skipUpdateStream?: boolean) => void;
  // resumeUpdates: (entity: Entity, skipUpdateStream?: boolean) => void;
};

// export type ExtendedContractComponentMethods<
//   S extends Schema = Schema,
//   TKeySchema extends KeySchema = KeySchema,
// > = ExtendedComponentMethods<S, unknown> & {
//   getWithKeys(): ComponentValue<S> | undefined;
//   getWithKeys(keys?: SchemaToPrimitives<TKeySchema>): ComponentValue<S> | undefined;
//   getWithKeys(keys?: SchemaToPrimitives<TKeySchema>, defaultValue?: ValueSansMetadata<S>): ComponentValue<S>;

//   hasWithKeys: (keys?: SchemaToPrimitives<TKeySchema>) => boolean;

//   useWithKeys(keys?: SchemaToPrimitives<TKeySchema>): ComponentValue<S> | undefined;
//   useWithKeys(keys?: SchemaToPrimitives<TKeySchema>, defaultValue?: ValueSansMetadata<S>): ComponentValue<S>;

//   setWithKeys(value: ComponentValue<S>, keys?: SchemaToPrimitives<TKeySchema>): void;

//   getEntityKeys: (entity: Entity) => SchemaToPrimitives<TKeySchema>;
// };
