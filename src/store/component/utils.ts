import { SchemaToPrimitives } from "@latticexyz/protocol-parser/internal";
import { KeySchema as UnparsedKeySchema } from "@latticexyz/store/internal";
import { Entity, Schema } from "@latticexyz/recs";
import { Hex, decodeAbiParameters, encodeAbiParameters } from "viem";
import { Store } from "tinybase/store";

import { entityToHexKeyTuple, hexKeyTupleToEntity } from "@/utils";
import { ComponentKey } from "@/store/component/types";

export const createComponentMethodsUtils = (store: Store, tableId: string) => {
  const paused = {
    set: (entity: Entity, paused: boolean) => {
      store.setValue(`paused__${tableId}__${entity}`, paused);
    },
    get: (entity: Entity) => {
      return store.getValue(`paused__${tableId}__${entity}`);
    },
  };

  return { paused };
};

export const arrayToIterator = <T>(array: T[]): IterableIterator<T> => {
  let i = 0;

  const iterator: Iterator<T> = {
    next() {
      if (i >= array.length) return { done: true, value: undefined };
      return { done: false, value: array[i++] };
    },
  };

  const iterable: IterableIterator<T> = {
    ...iterator,
    [Symbol.iterator]() {
      return this;
    },
  };

  return iterable;
};

export const encodeEntity = <S extends Schema, TKeySchema extends UnparsedKeySchema>(
  keySchema: TKeySchema,
  key: ComponentKey<S>,
) => {
  if (Object.keys(keySchema).length !== Object.keys(key).length) {
    throw new Error(
      `key length ${Object.keys(key).length} does not match key schema length ${Object.keys(keySchema).length}`,
    );
  }
  return hexKeyTupleToEntity(
    Object.entries(keySchema).map(([keyName, type]) => encodeAbiParameters([{ type: type.type }], [key[keyName]])),
  );
};

export const decodeEntity = <TKeySchema extends UnparsedKeySchema>(
  keySchema: TKeySchema,
  entity: Entity,
): SchemaToPrimitives<TKeySchema["type"]> => {
  const hexKeyTuple = entityToHexKeyTuple(entity);
  if (hexKeyTuple.length !== Object.keys(keySchema).length) {
    throw new Error(
      `entity key tuple length ${hexKeyTuple.length} does not match key schema length ${Object.keys(keySchema).length}`,
    );
  }
  return Object.fromEntries(
    Object.entries(keySchema).map(([key, type], index) => [
      key,
      decodeAbiParameters([{ type: type.type }], hexKeyTuple[index] as Hex)[0],
    ]),
  ) as SchemaToPrimitives<TKeySchema["type"]>;
};
