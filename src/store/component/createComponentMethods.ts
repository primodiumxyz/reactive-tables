import { Entity, OptionalTypes, Schema } from "@latticexyz/recs";
import { singletonEntity } from "@latticexyz/store-sync/recs";

import { TinyBaseAdapter } from "@/adapter";
import { CreateComponentMethodsOptions, CreateComponentMethodsResult } from "@/types";
import { ComponentValue, ComponentValueSansMetadata } from "@/store/component/types";

export const createComponentMethods = <S extends Schema, T = unknown>({
  store,
  tableId,
}: CreateComponentMethodsOptions): CreateComponentMethodsResult<S, T> => {
  // TODO: register an entity?

  /* ----------------------------------- SET ---------------------------------- */
  function set(value: ComponentValueSansMetadata<S, T>, entity?: Entity) {
    entity = entity ?? singletonEntity;
    if (entity === undefined) throw new Error(`[set ${entity} for ${tableId}] no entity registered`);

    const formatted = TinyBaseAdapter.format(Object.keys(value), Object.values(value));
    store.setRow(tableId, entity, formatted);
  }

  /* ----------------------------------- GET ---------------------------------- */
  function get(): ComponentValue<S, T> | undefined;
  function get(entity: Entity | undefined): ComponentValue<S, T> | undefined;
  function get(entity?: Entity | undefined, defaultValue?: ComponentValueSansMetadata<S>): ComponentValue<S, T>;
  function get(entity?: Entity, defaultValue?: ComponentValueSansMetadata<S>) {
    entity = entity ?? singletonEntity;
    if (entity === undefined) return defaultValue;

    const row = store.getRow(tableId, entity);

    const decoded = row ? TinyBaseAdapter.parse(row) : undefined; // empty object should be undefined
    return (decoded ?? defaultValue) as ComponentValue<S, T>;
  }

  return { get, set };
};
