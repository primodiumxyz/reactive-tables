import { SchemaAbiType } from "@latticexyz/schema-type/internal";

import { Type } from "@/lib/mud/types";

/**
 * Convert a schema ABI type to an TypeScript understandable type.
 *
 * Note: This is copied from the RECS library.
 *
 * @see [@]latticexyz/store-sync/recs/schemaAbiTypeToRecsType.ts
 * @category RECS
 */
export const schemaAbiTypeToRecsType = {
  uint8: Type.Number,
  uint16: Type.Number,
  uint24: Type.Number,
  uint32: Type.Number,
  uint40: Type.Number,
  uint48: Type.Number,
  uint56: Type.BigInt,
  uint64: Type.BigInt,
  uint72: Type.BigInt,
  uint80: Type.BigInt,
  uint88: Type.BigInt,
  uint96: Type.BigInt,
  uint104: Type.BigInt,
  uint112: Type.BigInt,
  uint120: Type.BigInt,
  uint128: Type.BigInt,
  uint136: Type.BigInt,
  uint144: Type.BigInt,
  uint152: Type.BigInt,
  uint160: Type.BigInt,
  uint168: Type.BigInt,
  uint176: Type.BigInt,
  uint184: Type.BigInt,
  uint192: Type.BigInt,
  uint200: Type.BigInt,
  uint208: Type.BigInt,
  uint216: Type.BigInt,
  uint224: Type.BigInt,
  uint232: Type.BigInt,
  uint240: Type.BigInt,
  uint248: Type.BigInt,
  uint256: Type.BigInt,
  int8: Type.Number,
  int16: Type.Number,
  int24: Type.Number,
  int32: Type.Number,
  int40: Type.Number,
  int48: Type.Number,
  int56: Type.BigInt,
  int64: Type.BigInt,
  int72: Type.BigInt,
  int80: Type.BigInt,
  int88: Type.BigInt,
  int96: Type.BigInt,
  int104: Type.BigInt,
  int112: Type.BigInt,
  int120: Type.BigInt,
  int128: Type.BigInt,
  int136: Type.BigInt,
  int144: Type.BigInt,
  int152: Type.BigInt,
  int160: Type.BigInt,
  int168: Type.BigInt,
  int176: Type.BigInt,
  int184: Type.BigInt,
  int192: Type.BigInt,
  int200: Type.BigInt,
  int208: Type.BigInt,
  int216: Type.BigInt,
  int224: Type.BigInt,
  int232: Type.BigInt,
  int240: Type.BigInt,
  int248: Type.BigInt,
  int256: Type.BigInt,
  bytes1: Type.String,
  bytes2: Type.String,
  bytes3: Type.String,
  bytes4: Type.String,
  bytes5: Type.String,
  bytes6: Type.String,
  bytes7: Type.String,
  bytes8: Type.String,
  bytes9: Type.String,
  bytes10: Type.String,
  bytes11: Type.String,
  bytes12: Type.String,
  bytes13: Type.String,
  bytes14: Type.String,
  bytes15: Type.String,
  bytes16: Type.String,
  bytes17: Type.String,
  bytes18: Type.String,
  bytes19: Type.String,
  bytes20: Type.String,
  bytes21: Type.String,
  bytes22: Type.String,
  bytes23: Type.String,
  bytes24: Type.String,
  bytes25: Type.String,
  bytes26: Type.String,
  bytes27: Type.String,
  bytes28: Type.String,
  bytes29: Type.String,
  bytes30: Type.String,
  bytes31: Type.String,
  bytes32: Type.String,
  bool: Type.Boolean,
  address: Type.String,
  "uint8[]": Type.NumberArray,
  "uint16[]": Type.NumberArray,
  "uint24[]": Type.NumberArray,
  "uint32[]": Type.NumberArray,
  "uint40[]": Type.NumberArray,
  "uint48[]": Type.NumberArray,
  "uint56[]": Type.BigIntArray,
  "uint64[]": Type.BigIntArray,
  "uint72[]": Type.BigIntArray,
  "uint80[]": Type.BigIntArray,
  "uint88[]": Type.BigIntArray,
  "uint96[]": Type.BigIntArray,
  "uint104[]": Type.BigIntArray,
  "uint112[]": Type.BigIntArray,
  "uint120[]": Type.BigIntArray,
  "uint128[]": Type.BigIntArray,
  "uint136[]": Type.BigIntArray,
  "uint144[]": Type.BigIntArray,
  "uint152[]": Type.BigIntArray,
  "uint160[]": Type.BigIntArray,
  "uint168[]": Type.BigIntArray,
  "uint176[]": Type.BigIntArray,
  "uint184[]": Type.BigIntArray,
  "uint192[]": Type.BigIntArray,
  "uint200[]": Type.BigIntArray,
  "uint208[]": Type.BigIntArray,
  "uint216[]": Type.BigIntArray,
  "uint224[]": Type.BigIntArray,
  "uint232[]": Type.BigIntArray,
  "uint240[]": Type.BigIntArray,
  "uint248[]": Type.BigIntArray,
  "uint256[]": Type.BigIntArray,
  "int8[]": Type.NumberArray,
  "int16[]": Type.NumberArray,
  "int24[]": Type.NumberArray,
  "int32[]": Type.NumberArray,
  "int40[]": Type.NumberArray,
  "int48[]": Type.NumberArray,
  "int56[]": Type.BigIntArray,
  "int64[]": Type.BigIntArray,
  "int72[]": Type.BigIntArray,
  "int80[]": Type.BigIntArray,
  "int88[]": Type.BigIntArray,
  "int96[]": Type.BigIntArray,
  "int104[]": Type.BigIntArray,
  "int112[]": Type.BigIntArray,
  "int120[]": Type.BigIntArray,
  "int128[]": Type.BigIntArray,
  "int136[]": Type.BigIntArray,
  "int144[]": Type.BigIntArray,
  "int152[]": Type.BigIntArray,
  "int160[]": Type.BigIntArray,
  "int168[]": Type.BigIntArray,
  "int176[]": Type.BigIntArray,
  "int184[]": Type.BigIntArray,
  "int192[]": Type.BigIntArray,
  "int200[]": Type.BigIntArray,
  "int208[]": Type.BigIntArray,
  "int216[]": Type.BigIntArray,
  "int224[]": Type.BigIntArray,
  "int232[]": Type.BigIntArray,
  "int240[]": Type.BigIntArray,
  "int248[]": Type.BigIntArray,
  "int256[]": Type.BigIntArray,
  "bytes1[]": Type.StringArray,
  "bytes2[]": Type.StringArray,
  "bytes3[]": Type.StringArray,
  "bytes4[]": Type.StringArray,
  "bytes5[]": Type.StringArray,
  "bytes6[]": Type.StringArray,
  "bytes7[]": Type.StringArray,
  "bytes8[]": Type.StringArray,
  "bytes9[]": Type.StringArray,
  "bytes10[]": Type.StringArray,
  "bytes11[]": Type.StringArray,
  "bytes12[]": Type.StringArray,
  "bytes13[]": Type.StringArray,
  "bytes14[]": Type.StringArray,
  "bytes15[]": Type.StringArray,
  "bytes16[]": Type.StringArray,
  "bytes17[]": Type.StringArray,
  "bytes18[]": Type.StringArray,
  "bytes19[]": Type.StringArray,
  "bytes20[]": Type.StringArray,
  "bytes21[]": Type.StringArray,
  "bytes22[]": Type.StringArray,
  "bytes23[]": Type.StringArray,
  "bytes24[]": Type.StringArray,
  "bytes25[]": Type.StringArray,
  "bytes26[]": Type.StringArray,
  "bytes27[]": Type.StringArray,
  "bytes28[]": Type.StringArray,
  "bytes29[]": Type.StringArray,
  "bytes30[]": Type.StringArray,
  "bytes31[]": Type.StringArray,
  "bytes32[]": Type.StringArray,
  "bool[]": Type.T, // no boolean arr,
  "address[]": Type.StringArray,
  bytes: Type.String,
  string: Type.String,
} as const satisfies Record<SchemaAbiType, Type>;

/**
 * Infer a TypeScript-understandable type (an enum associated with the type) from a schema ABI type.
 *
 * Note: This is copied from the RECS library.
 *
 * @see [@]latticexyz/store-sync/recs/schemaAbiTypeToRecsType.ts
 * @category RECS
 */
export type SchemaAbiTypeToRecsType<T extends SchemaAbiType> = (typeof schemaAbiTypeToRecsType)[T];