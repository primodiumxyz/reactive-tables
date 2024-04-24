import { Entity } from "@latticexyz/recs";

import { BaseTableMetadata, ComponentValue, OriginalComponentMethods } from "@/components/types";
import { CreateQueryResult, CreateQueryWrapperOptions } from "@/queries";
import { Metadata, Schema } from "@/lib";

export type InternalTable<
  S extends Schema = Schema,
  M extends Metadata = Metadata,
  metadata extends InternalTableMetadata<S, M> = InternalTableMetadata<S, M>,
  T = unknown,
> = InternalTableMethods<S, T> & {
  readonly id: metadata["tableId"];
  readonly schema: metadata["schema"];
  readonly metadata: M & {
    readonly componentName: metadata["name"];
    readonly tableName: `internal__${metadata["name"]}`;
  };
};

export type InternalTableMetadata<S extends Schema, M extends Metadata = Metadata> = M &
  BaseTableMetadata<S> & {
    readonly namespace: "internal";
  };

// We pass the table to be able to infer if it's a contract or internal table (e.g. the latter won't contain metadata values)
export type InternalTableMethods<S extends Schema, T = unknown> = OriginalComponentMethods & {
  get(): ComponentValue<S, T> | undefined;
  get(entity: Entity | undefined): ComponentValue<S, T> | undefined;
  get(entity?: Entity | undefined, defaultValue?: ComponentValue<S, T>): ComponentValue<S, T>;

  set: (value: ComponentValue<S, T>, entity?: Entity) => void;
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
  use(entity: Entity | undefined, defaultValue?: ComponentValue<S, T>): ComponentValue<S, T>;

  pauseUpdates: (entity?: Entity, value?: ComponentValue<S, T>) => void;
  resumeUpdates: (entity?: Entity) => void;

  createQuery: (options: Omit<CreateQueryWrapperOptions<S, T>, "queries" | "tableId" | "schema">) => CreateQueryResult;
};
