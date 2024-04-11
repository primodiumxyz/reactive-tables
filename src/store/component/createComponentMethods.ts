import { ComponentValue, Entity, Schema } from "@latticexyz/recs";
import { singletonEntity } from "@latticexyz/store-sync/recs";
import { decodeValueArgs, encodeValueArgs } from "@latticexyz/protocol-parser/internal";
import { Hex } from "viem";

import { CreateComponentMethodsOptions, CreateComponentMethodsResult } from "@/types";
import { ValueSansMetadata } from "@/store/component/types";

export const createComponentMethods = <S extends Schema, T = unknown>({
  store,
  tableId,
  keySchema,
  valueSchema,
  schema,
}: CreateComponentMethodsOptions): CreateComponentMethodsResult<S, T> => {
  // TODO: register an entity?

  function set(value: ComponentValue<S, T>, entity?: Entity) {
    entity = entity ?? singletonEntity;
    if (entity === undefined) throw new Error(`[set ${entity} for ${tableId}] no entity registered`);

    // We want to encode values set on the client side the same way as contract values
    // so it can be decoded in a consistent way
    const encodedValue = encodeValueArgs(valueSchema, value);
    store.setRow(tableId, entity, encodedValue);
  }

  function get(): ComponentValue<S, T> | undefined;
  function get(entity: Entity | undefined): ComponentValue<S, T> | undefined;
  function get(entity?: Entity | undefined, defaultValue?: ValueSansMetadata<S>): ComponentValue<S, T>;
  function get(entity?: Entity, defaultValue?: ValueSansMetadata<S>) {
    entity = entity ?? singletonEntity;
    if (entity === undefined) return defaultValue;

    const row = store.getRow(tableId, entity);

    const value = {
      ...row,
      ...decodeValueArgs(valueSchema, {
        staticData: (row.__staticData as Hex) ?? "0x",
        encodedLengths: (row.__encodedLengths as Hex) ?? "0x",
        dynamicData: (row.__dynamicData as Hex) ?? "0x",
      }),
    };

    return (value ?? defaultValue) as ComponentValue<S, T>;
  }

  return { get, set };
};
