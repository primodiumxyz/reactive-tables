import { Entity } from "@latticexyz/recs";
import { concatHex, Hex, isHex, size, sliceHex } from "viem";
import createDebug from "debug";

/* ---------------------------------- DEBUG --------------------------------- */
export const debug = createDebug("primodium:tiny-base-integration");
export const error = createDebug("primodium:tiny-base-integration");
// Pipe debug output to stdout instead of stderr
debug.log = console.debug.bind(console);
// Pipe error output to stderr
error.log = console.error.bind(console);

/* ----------------------------------- MUD ---------------------------------- */
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
