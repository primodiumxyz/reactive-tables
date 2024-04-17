import { Store as StoreConfig } from "@latticexyz/store";
import { Store } from "tinybase/store";
import { Entity, Metadata, Schema } from "@latticexyz/recs";

import { Component, ComponentValue, Table } from "@/store/component/types";

export type ComponentSystemUpdate<S extends Schema, T = unknown> = {
  tableId: string;
  entity: Entity;
  value: [ComponentValue<S, T> | undefined, ComponentValue<S, T> | undefined]; // [new, old]
};

export type CreateComponentSystemOptions<
  // table extends Table = Table,
  // config extends StoreConfig = StoreConfig,
  S extends Schema = Schema,
  // M extends Metadata = Metadata,
  T = unknown,
> = {
  // component: Component<table, config, S, M, T>;
  tableId: string;
  system: (update: ComponentSystemUpdate<S, T>) => void;
  store: Store;
  options?: {
    // Run the system for all entities on creation (default: true)
    runOnInit?: boolean;
    // Run the system for all entities whenever the value for one of them changes (default: false)
    affectAllEntities?: boolean;
    // Run the system for an entity if we can't be sure if it has changed or not (default: true)
    // (i.e. this can happen if TinyBase can't figure out if the cells inside the row of the entity have changed)
    affectIfChangedUndefined?: boolean;
  };
};

export type CreateComponentSystemResult = {
  unsubscribe: () => Store;
};
