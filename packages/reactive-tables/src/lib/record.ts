import { SchemaToPrimitives } from "@latticexyz/protocol-parser/internal";
import { concatHex, decodeAbiParameters, encodeAbiParameters, Hex, isHex, size, sliceHex } from "viem";

import { KeySchema } from "@/tables/contract";
import { Properties } from "@/tables";
import { Schema } from "@/lib/external/mud/schema";

// (jsdocs)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createTableKeyMethods } from "@/tables/contract";

/**
 * A record is a string that represents a tuple of hex keys, to identify a row in a table.
 *
 * Note: Replaces RECS Entity.
 *
 * @category Record
 */
// TODO(review): This was a string before, but shouldn't it be a hex string?
export type $Record = Hex & { readonly __opaque__: "$Record" };

/**
 * A singleton $Record associated with a table including a single row.
 *
 * Note: Replaces RECS singletonEntity.
 *
 * @category Record
 */
export const default$Record = hexKeyTupleTo$Record([]);

/**
 * Concatenate a tuple of hex keys into a single record.
 *
 * Note: This is used when decoding a log inside the storage adapter to get the concerned record.
 *
 * @param hexKeyTuple Tuple of hex keys.
 * @returns A single record.
 *
 * @category Record
 */
export function hexKeyTupleTo$Record(hexKeyTuple: readonly Hex[]): $Record {
  return concatHex(hexKeyTuple as Hex[]) as $Record;
}

/**
 * Convert a record into a tuple of hex keys.
 *
 * @param $record A single record.
 * @returns Tuple of hex keys.
 *
 * @category Record
 */
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

/**
 * Concatenate a tuple of hex keys into a single record, after encoding them into hex strings.
 *
 * Note: This is especially useful when trying to retrieve a record using its separate key properties, as it is done in the table key
 * methods attached to contract tables (see {@link createTableKeyMethods}).
 *
 * @category Record
 */
export const encode$Record = <S extends Schema, KS extends KeySchema, T = unknown>(
  keySchema: KS,
  keys: Properties<S, T>,
) => {
  if (Object.keys(keySchema).length !== Object.keys(keys).length) {
    throw new Error(
      `$record length ${Object.keys(keys).length} does not match $record schema length ${Object.keys(keySchema).length}`,
    );
  }

  return hexKeyTupleTo$Record(
    // @ts-expect-error keys[keyName] could be undefined (it won't, but the given type needs to be adapted, which requires a more global refactor)
    Object.entries(keySchema).map(([keyName, type]) => encodeAbiParameters([{ type }], [keys[keyName]])),
  );
};

/**
 * Decode a record into a tuple of hex keys, after decoding them from hex strings.
 *
 * Note: This is useful for retrieving the values of each separate key property from a record, using its schema and actual record string.
 *
 * @category Record
 */
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

/**
 * Convert an array into an iterable iterator.
 *
 * Note: This is used for providing an iterator for all records inside a table, and provide a similar
 * API to the one provided by RECS (entities iterator).
 *
 * @param array Any array.
 * @returns An iterable iterator.
 * @category Record
 */
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
