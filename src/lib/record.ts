import { concatHex, decodeAbiParameters, encodeAbiParameters, type Hex, isHex, size, sliceHex } from "viem";

import type { Properties } from "@/tables";
import type { AbiToSchema, AbiKeySchema, SchemaToPrimitives } from "@/lib";

// (jsdocs)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createTableKeyMethods } from "@/tables";

/**
 * An entity is a string that represents a tuple of hex keys, to identify a row in a table.
 *
 * @category Entity
 */
export type Entity = Hex & { readonly __opaque__: "Entity" };
export type EntitySymbol = symbol & { readonly __opaque__: "EntitySymbol" };

/**
 * A singleton Entity associated with a table including a single row.
 *
 * Note: Replaces RECS singletonEntity.
 *
 * @category Entity
 */
export const defaultEntity = hexKeyTupleToEntity([]);

/**
 * Concatenate a tuple of hex keys into a single entity.
 *
 * Note: This is used when decoding a log inside the storage adapter to get the concerned entity.
 *
 * @param hexKeyTuple Tuple of hex keys.
 * @returns A single entity.
 *
 * @category Entity
 */
export function hexKeyTupleToEntity(hexKeyTuple: readonly Hex[]): Entity {
  return concatHex(hexKeyTuple as Hex[]) as Entity;
}

/**
 * Convert an entity into a tuple of hex keys.
 *
 * @param entity A single entity.
 * @returns Tuple of hex keys.
 *
 * @category Entity
 */
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

// Valid keys to use as schema

/**
 * Concatenate a tuple of hex keys into a single entity, after encoding them into hex strings.
 *
 * Note: This is especially useful when trying to retrieve an entity using its separate key properties, as it is done in the table key
 * methods attached to contract tables (see {@link createTableKeyMethods}).
 *
 * @category Entity
 */
export const encodeEntity = <TKeySchema extends AbiKeySchema, T = unknown>(
  abiKeySchema: TKeySchema,
  keys: Properties<AbiToSchema<TKeySchema>, T>,
) => {
  if (Object.keys(abiKeySchema).length !== Object.keys(keys).length) {
    throw new Error(
      `entity length ${Object.keys(keys).length} does not match entity schema length ${Object.keys(abiKeySchema).length}`,
    );
  }

  return hexKeyTupleToEntity(
    Object.entries(abiKeySchema).map(([keyName, type]) => encodeAbiParameters([{ type }], [keys[keyName]])),
  );
};

/**
 * Decode an entity into a tuple of hex keys, after decoding them from hex strings.
 *
 * Note: This is useful for retrieving the values of each separate key property from an entity, using its schema and actual entity string.
 *
 * @category Entity
 */
export const decodeEntity = <TKeySchema extends AbiKeySchema>(
  abiKeySchema: TKeySchema,
  entity: Entity,
): SchemaToPrimitives<TKeySchema> => {
  const hexKeyTuple = entityToHexKeyTuple(entity);
  if (hexKeyTuple.length !== Object.keys(abiKeySchema).length) {
    throw new Error(
      `entity entity tuple length ${hexKeyTuple.length} does not match entity schema length ${Object.keys(abiKeySchema).length}`,
    );
  }

  return Object.fromEntries(
    Object.entries(abiKeySchema).map(([entity, type], index) => [
      entity,
      decodeAbiParameters([{ type }], hexKeyTuple[index] as Hex)[0],
    ]),
  ) as SchemaToPrimitives<TKeySchema>;
};

/**
 * Get the symbol corresponding to an entity's hex ID.
 * Records are represented as symbols internally for memory efficiency.
 */
export function getEntitySymbol(entityHex: Hex): EntitySymbol {
  return Symbol.for(entityHex) as EntitySymbol;
}

/**
 * Get the underlying entity hex of an entity symbol.
 */
export function getEntityHex(entitySymbol: EntitySymbol): Entity {
  return Symbol.keyFor(entitySymbol) as Entity;
}
