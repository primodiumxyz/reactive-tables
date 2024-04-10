import { Type as RecsType } from "@latticexyz/recs";
import { transportObserver } from "@latticexyz/common";
import { SchemaAbiType } from "@latticexyz/schema-type/internal";
import { createPublicClient as createViemPublicClient, fallback, http, PublicClient, Transport } from "viem";
import createDebug from "debug";

import { NetworkConfig } from "@/types";

/* ---------------------------------- VIEM ---------------------------------- */
export const createPublicClient = (networkConfig: NetworkConfig): PublicClient =>
  createViemPublicClient({
    chain: networkConfig.chain,
    transport: transportObserver(fallback([http()])),
    pollingInterval: 1000,
  });

/* ---------------------------------- DEBUG --------------------------------- */
export const debug = createDebug("primodium:tiny-base-integration");
export const error = createDebug("primodium:tiny-base-integration");
// Pipe debug output to stdout instead of stderr
debug.log = console.debug.bind(console);
// Pipe error output to stderr
error.log = console.error.bind(console);

/* ---------------------------------- RECS ---------------------------------- */
// Copied from https://github.com/latticexyz/mud/blob/ade94a7fa761070719bcd4b4dac6cb8cc7783c3b/packages/store-sync/src/recs/schemaAbiTypeToRecsType.ts#L205
export const schemaAbiTypeToRecsType = {
  uint8: RecsType.Number,
  uint16: RecsType.Number,
  uint24: RecsType.Number,
  uint32: RecsType.Number,
  uint40: RecsType.Number,
  uint48: RecsType.Number,
  uint56: RecsType.BigInt,
  uint64: RecsType.BigInt,
  uint72: RecsType.BigInt,
  uint80: RecsType.BigInt,
  uint88: RecsType.BigInt,
  uint96: RecsType.BigInt,
  uint104: RecsType.BigInt,
  uint112: RecsType.BigInt,
  uint120: RecsType.BigInt,
  uint128: RecsType.BigInt,
  uint136: RecsType.BigInt,
  uint144: RecsType.BigInt,
  uint152: RecsType.BigInt,
  uint160: RecsType.BigInt,
  uint168: RecsType.BigInt,
  uint176: RecsType.BigInt,
  uint184: RecsType.BigInt,
  uint192: RecsType.BigInt,
  uint200: RecsType.BigInt,
  uint208: RecsType.BigInt,
  uint216: RecsType.BigInt,
  uint224: RecsType.BigInt,
  uint232: RecsType.BigInt,
  uint240: RecsType.BigInt,
  uint248: RecsType.BigInt,
  uint256: RecsType.BigInt,
  int8: RecsType.Number,
  int16: RecsType.Number,
  int24: RecsType.Number,
  int32: RecsType.Number,
  int40: RecsType.Number,
  int48: RecsType.Number,
  int56: RecsType.BigInt,
  int64: RecsType.BigInt,
  int72: RecsType.BigInt,
  int80: RecsType.BigInt,
  int88: RecsType.BigInt,
  int96: RecsType.BigInt,
  int104: RecsType.BigInt,
  int112: RecsType.BigInt,
  int120: RecsType.BigInt,
  int128: RecsType.BigInt,
  int136: RecsType.BigInt,
  int144: RecsType.BigInt,
  int152: RecsType.BigInt,
  int160: RecsType.BigInt,
  int168: RecsType.BigInt,
  int176: RecsType.BigInt,
  int184: RecsType.BigInt,
  int192: RecsType.BigInt,
  int200: RecsType.BigInt,
  int208: RecsType.BigInt,
  int216: RecsType.BigInt,
  int224: RecsType.BigInt,
  int232: RecsType.BigInt,
  int240: RecsType.BigInt,
  int248: RecsType.BigInt,
  int256: RecsType.BigInt,
  bytes1: RecsType.String,
  bytes2: RecsType.String,
  bytes3: RecsType.String,
  bytes4: RecsType.String,
  bytes5: RecsType.String,
  bytes6: RecsType.String,
  bytes7: RecsType.String,
  bytes8: RecsType.String,
  bytes9: RecsType.String,
  bytes10: RecsType.String,
  bytes11: RecsType.String,
  bytes12: RecsType.String,
  bytes13: RecsType.String,
  bytes14: RecsType.String,
  bytes15: RecsType.String,
  bytes16: RecsType.String,
  bytes17: RecsType.String,
  bytes18: RecsType.String,
  bytes19: RecsType.String,
  bytes20: RecsType.String,
  bytes21: RecsType.String,
  bytes22: RecsType.String,
  bytes23: RecsType.String,
  bytes24: RecsType.String,
  bytes25: RecsType.String,
  bytes26: RecsType.String,
  bytes27: RecsType.String,
  bytes28: RecsType.String,
  bytes29: RecsType.String,
  bytes30: RecsType.String,
  bytes31: RecsType.String,
  bytes32: RecsType.String,
  bool: RecsType.Boolean,
  address: RecsType.String,
  "uint8[]": RecsType.NumberArray,
  "uint16[]": RecsType.NumberArray,
  "uint24[]": RecsType.NumberArray,
  "uint32[]": RecsType.NumberArray,
  "uint40[]": RecsType.NumberArray,
  "uint48[]": RecsType.NumberArray,
  "uint56[]": RecsType.BigIntArray,
  "uint64[]": RecsType.BigIntArray,
  "uint72[]": RecsType.BigIntArray,
  "uint80[]": RecsType.BigIntArray,
  "uint88[]": RecsType.BigIntArray,
  "uint96[]": RecsType.BigIntArray,
  "uint104[]": RecsType.BigIntArray,
  "uint112[]": RecsType.BigIntArray,
  "uint120[]": RecsType.BigIntArray,
  "uint128[]": RecsType.BigIntArray,
  "uint136[]": RecsType.BigIntArray,
  "uint144[]": RecsType.BigIntArray,
  "uint152[]": RecsType.BigIntArray,
  "uint160[]": RecsType.BigIntArray,
  "uint168[]": RecsType.BigIntArray,
  "uint176[]": RecsType.BigIntArray,
  "uint184[]": RecsType.BigIntArray,
  "uint192[]": RecsType.BigIntArray,
  "uint200[]": RecsType.BigIntArray,
  "uint208[]": RecsType.BigIntArray,
  "uint216[]": RecsType.BigIntArray,
  "uint224[]": RecsType.BigIntArray,
  "uint232[]": RecsType.BigIntArray,
  "uint240[]": RecsType.BigIntArray,
  "uint248[]": RecsType.BigIntArray,
  "uint256[]": RecsType.BigIntArray,
  "int8[]": RecsType.NumberArray,
  "int16[]": RecsType.NumberArray,
  "int24[]": RecsType.NumberArray,
  "int32[]": RecsType.NumberArray,
  "int40[]": RecsType.NumberArray,
  "int48[]": RecsType.NumberArray,
  "int56[]": RecsType.BigIntArray,
  "int64[]": RecsType.BigIntArray,
  "int72[]": RecsType.BigIntArray,
  "int80[]": RecsType.BigIntArray,
  "int88[]": RecsType.BigIntArray,
  "int96[]": RecsType.BigIntArray,
  "int104[]": RecsType.BigIntArray,
  "int112[]": RecsType.BigIntArray,
  "int120[]": RecsType.BigIntArray,
  "int128[]": RecsType.BigIntArray,
  "int136[]": RecsType.BigIntArray,
  "int144[]": RecsType.BigIntArray,
  "int152[]": RecsType.BigIntArray,
  "int160[]": RecsType.BigIntArray,
  "int168[]": RecsType.BigIntArray,
  "int176[]": RecsType.BigIntArray,
  "int184[]": RecsType.BigIntArray,
  "int192[]": RecsType.BigIntArray,
  "int200[]": RecsType.BigIntArray,
  "int208[]": RecsType.BigIntArray,
  "int216[]": RecsType.BigIntArray,
  "int224[]": RecsType.BigIntArray,
  "int232[]": RecsType.BigIntArray,
  "int240[]": RecsType.BigIntArray,
  "int248[]": RecsType.BigIntArray,
  "int256[]": RecsType.BigIntArray,
  "bytes1[]": RecsType.StringArray,
  "bytes2[]": RecsType.StringArray,
  "bytes3[]": RecsType.StringArray,
  "bytes4[]": RecsType.StringArray,
  "bytes5[]": RecsType.StringArray,
  "bytes6[]": RecsType.StringArray,
  "bytes7[]": RecsType.StringArray,
  "bytes8[]": RecsType.StringArray,
  "bytes9[]": RecsType.StringArray,
  "bytes10[]": RecsType.StringArray,
  "bytes11[]": RecsType.StringArray,
  "bytes12[]": RecsType.StringArray,
  "bytes13[]": RecsType.StringArray,
  "bytes14[]": RecsType.StringArray,
  "bytes15[]": RecsType.StringArray,
  "bytes16[]": RecsType.StringArray,
  "bytes17[]": RecsType.StringArray,
  "bytes18[]": RecsType.StringArray,
  "bytes19[]": RecsType.StringArray,
  "bytes20[]": RecsType.StringArray,
  "bytes21[]": RecsType.StringArray,
  "bytes22[]": RecsType.StringArray,
  "bytes23[]": RecsType.StringArray,
  "bytes24[]": RecsType.StringArray,
  "bytes25[]": RecsType.StringArray,
  "bytes26[]": RecsType.StringArray,
  "bytes27[]": RecsType.StringArray,
  "bytes28[]": RecsType.StringArray,
  "bytes29[]": RecsType.StringArray,
  "bytes30[]": RecsType.StringArray,
  "bytes31[]": RecsType.StringArray,
  "bytes32[]": RecsType.StringArray,
  "bool[]": RecsType.T, // no boolean arr,
  "address[]": RecsType.StringArray,
  bytes: RecsType.String,
  string: RecsType.String,
} as const satisfies Record<SchemaAbiType, RecsType>;

export type SchemaAbiTypeToRecsType<T extends SchemaAbiType> = (typeof schemaAbiTypeToRecsType)[T];
