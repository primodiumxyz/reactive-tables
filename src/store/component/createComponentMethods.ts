import { ComponentValue, Entity, OptionalTypes, Schema } from "@latticexyz/recs";
import { singletonEntity } from "@latticexyz/store-sync/recs";

import { CreateComponentMethodsOptions, CreateComponentMethodsResult } from "@/types";
import { ValueSansMetadata } from "@/store/component/types";

export const createComponentMethods = <S extends Schema, T = unknown>({
  store,
  tableId,
  keySchema,
  valueSchema,
  schema,
}: CreateComponentMethodsOptions): CreateComponentMethodsResult<S, T> => {
  // TODO: return add to register an entity?

  function set(value: ComponentValue<S, T>, entity?: Entity) {
    entity = entity ?? singletonEntity;
    if (entity === undefined) throw new Error(`[set ${entity} for ${tableId}] no entity registered`);

    for (const [key, val] of Object.entries(value)) {
      const type = valueSchema[key];
      // TODO: handle non-primitive types
      const isArray = type.includes("[]");

      store.setCell(tableId, entity, key, val);
    }
  }

  function get(): ComponentValue<S, T> | undefined;
  function get(entity: Entity | undefined): ComponentValue<S, T> | undefined;
  function get(entity?: Entity | undefined, defaultValue?: ValueSansMetadata<S>): ComponentValue<S, T>;
  function get(entity?: Entity, defaultValue?: ValueSansMetadata<S>) {
    entity = entity ?? singletonEntity;
    if (entity === undefined) return defaultValue;

    const row = store.getRow(tableId, entity);
    let value: Record<string, unknown> = {};

    for (const key of Object.keys(schema)) {
      const val = row[key];
      if (val === undefined && !OptionalTypes.includes(schema[key])) return undefined;

      const type = valueSchema[key];
      // TODO: handle non-primitive types
      const isArray = type && type.includes("[]"); // !type means it's __staticData, etc

      value[key] = val;
    }

    return (value ?? defaultValue) as ComponentValue<S, T>;
  }

  return { get, set };
};
