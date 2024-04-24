import { Entity, Schema } from "@latticexyz/recs";
import { SchemaToPrimitives, KeySchema } from "@latticexyz/protocol-parser/internal";
import { concatHex, decodeAbiParameters, encodeAbiParameters, Hex, isHex, size, sliceHex } from "viem";

import { ComponentKey } from "@/components/types";

export const singletonEntity = hexKeyTupleToEntity([]);
export function hexKeyTupleToEntity(hexKeyTuple: readonly Hex[]): Entity {
  return concatHex(hexKeyTuple as Hex[]) as Entity;
}

export function entityToHexKeyTuple(entity: Entity): readonly Hex[] {
  if (!isHex(entity)) {
    throw new Error(`entity ${entity} is not a hex string`);
  }
  const length = size(entity);
  if (length % 32 !== 0) {
    throw new Error(`entity length ${length} is not a multiple of 32 bytes`);
  }
  return new Array(length / 32).fill(0).map((_, index) => sliceHex(entity, index * 32, (index + 1) * 32));
}

export const encodeEntity = <S extends Schema, TKeySchema extends KeySchema>(
  keySchema: TKeySchema,
  keys: ComponentKey<S>,
) => {
  if (Object.keys(keySchema).length !== Object.keys(keys).length) {
    throw new Error(
      `key length ${Object.keys(keys).length} does not match key schema length ${Object.keys(keySchema).length}`,
    );
  }

  return hexKeyTupleToEntity(
    // TODO: handle this type, let the compiler know that we won't pass a string (as not expected from the possible types)
    Object.entries(keySchema).map(([keyName, type]) => encodeAbiParameters([{ type }], [keys[keyName]])),
  );
};

export const decodeEntity = <TKeySchema extends KeySchema>(
  keySchema: TKeySchema,
  entity: Entity,
): SchemaToPrimitives<TKeySchema> => {
  const hexKeyTuple = entityToHexKeyTuple(entity);
  if (hexKeyTuple.length !== Object.keys(keySchema).length) {
    throw new Error(
      `entity key tuple length ${hexKeyTuple.length} does not match key schema length ${Object.keys(keySchema).length}`,
    );
  }

  return Object.fromEntries(
    Object.entries(keySchema).map(([key, type], index) => [
      key,
      decodeAbiParameters([{ type }], hexKeyTuple[index] as Hex)[0],
    ]),
  ) as SchemaToPrimitives<TKeySchema>;
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
