import { Entity as $Record } from "@latticexyz/recs";
import { SchemaToPrimitives } from "@latticexyz/protocol-parser/internal";
import { concatHex, decodeAbiParameters, encodeAbiParameters, Hex, isHex, size, sliceHex } from "viem";

import { Properties } from "@/tables";
import { KeySchema } from "@/tables/contract";
import { Schema } from "@/lib/mud/types";
export { $Record };

export const empty$Record = hexKeyTupleTo$Record([]);
export function hexKeyTupleTo$Record(hexKeyTuple: readonly Hex[]): $Record {
  return concatHex(hexKeyTuple as Hex[]) as $Record;
}

export function $recordToHexKeyTuple($record: $Record): readonly Hex[] {
  if (!isHex($record)) {
    throw new Error(`$record ${$record} is not a hex string`);
  }
  const length = size($record);
  if (length % 32 !== 0) {
    throw new Error(`$record length ${length} is not a multiple of 32 bytes`);
  }
  return new Array(length / 32).fill(0).map((_, index) => sliceHex($record, index * 32, (index + 1) * 32));
}

export const encode$Record = <S extends Schema, TKeySchema extends KeySchema>(
  keySchema: TKeySchema,
  keys: Properties<S>,
) => {
  if (Object.keys(keySchema).length !== Object.keys(keys).length) {
    throw new Error(
      `$record length ${Object.keys(keys).length} does not match $record schema length ${Object.keys(keySchema).length}`,
    );
  }

  return hexKeyTupleTo$Record(
    // TODO: handle this type, let the compiler know that we won't pass a string (as not expected from the possible types)
    Object.entries(keySchema).map(([keyName, type]) => encodeAbiParameters([{ type }], [keys[keyName]])),
  );
};

export const decode$Record = <TKeySchema extends KeySchema>(
  keySchema: TKeySchema,
  $record: $Record,
): SchemaToPrimitives<TKeySchema> => {
  const hexKeyTuple = $recordToHexKeyTuple($record);
  if (hexKeyTuple.length !== Object.keys(keySchema).length) {
    throw new Error(
      `$record $record tuple length ${hexKeyTuple.length} does not match $record schema length ${Object.keys(keySchema).length}`,
    );
  }

  return Object.fromEntries(
    Object.entries(keySchema).map(([$record, type], index) => [
      $record,
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
