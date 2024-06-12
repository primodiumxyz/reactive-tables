import { concatHex, type Hex, isHex, size, sliceHex } from "viem";

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
