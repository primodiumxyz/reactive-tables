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
  table extends Table = Table,
  config extends StoreConfig = StoreConfig,
  S extends Schema = Schema,
  M extends Metadata = Metadata,
  T = unknown,
> = {
  component: Component<table, config, S, M, T>;
  system: (update: ComponentSystemUpdate<S, T>) => void;
  store: Store;
  options?: { runOnInit?: boolean };
};

export type CreateComponentSystemResult = {
  unsubscribe: () => Store;
};
