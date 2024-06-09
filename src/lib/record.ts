import { concatHex, decodeAbiParameters, encodeAbiParameters, type Hex, isHex, size, sliceHex } from "viem";

import type { Properties } from "@/tables";
import type { AbiToSchema, AbiKeySchema, SchemaToPrimitives } from "@/lib";

// (jsdocs)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createTableKeyMethods } from "@/tables";

/**
 * A record is a string that represents a tuple of hex keys, to identify a row in a table.
 *
 * Note: Replaces RECS Entity.
 *
 * @category Record
 */
export type $Record = Hex & { readonly __opaque__: "$Record" };
export type $RecordSymbol = symbol & { readonly __opaque__: "$RecordSymbol" };

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

// Valid keys to use as schema

/**
 * Concatenate a tuple of hex keys into a single record, after encoding them into hex strings.
 *
 * Note: This is especially useful when trying to retrieve a record using its separate key properties, as it is done in the table key
 * methods attached to contract tables (see {@link createTableKeyMethods}).
 *
 * @category Record
 */
export const encode$Record = <TKeySchema extends AbiKeySchema, T = unknown>(
  abiKeySchema: TKeySchema,
  keys: Properties<AbiToSchema<TKeySchema>, T>,
) => {
  if (Object.keys(abiKeySchema).length !== Object.keys(keys).length) {
    throw new Error(
      `$record length ${Object.keys(keys).length} does not match $record schema length ${Object.keys(abiKeySchema).length}`,
    );
  }

  return hexKeyTupleTo$Record(
    Object.entries(abiKeySchema).map(([keyName, type]) => encodeAbiParameters([{ type }], [keys[keyName]])),
  );
};

/**
 * Decode a record into a tuple of hex keys, after decoding them from hex strings.
 *
 * Note: This is useful for retrieving the values of each separate key property from a record, using its schema and actual record string.
 *
 * @category Record
 */
export const decode$Record = <TKeySchema extends AbiKeySchema>(
  abiKeySchema: TKeySchema,
  $record: $Record,
): SchemaToPrimitives<TKeySchema> => {
  const hexKeyTuple = $recordToHexKeyTuple($record);
  if (hexKeyTuple.length !== Object.keys(abiKeySchema).length) {
    throw new Error(
      `$record $record tuple length ${hexKeyTuple.length} does not match $record schema length ${Object.keys(abiKeySchema).length}`,
    );
  }

  return Object.fromEntries(
    Object.entries(abiKeySchema).map(([$record, type], index) => [
      $record,
      decodeAbiParameters([{ type }], hexKeyTuple[index] as Hex)[0],
    ]),
  ) as SchemaToPrimitives<TKeySchema>;
};

/**
 * Get the symbol corresponding to a record's hex ID.
 * Records are represented as symbols internally for memory efficiency.
 */
export function get$RecordSymbol($recordHex: Hex): $RecordSymbol {
  return Symbol.for($recordHex) as $RecordSymbol;
}

/**
 * Get the underlying record hex of a record symbol.
 */
export function get$RecordHex($recordSymbol: $RecordSymbol): $Record {
  return Symbol.keyFor($recordSymbol) as $Record;
}
