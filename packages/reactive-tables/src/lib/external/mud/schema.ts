import { SchemaAbiType } from "@latticexyz/schema-type/internal";

import { $Record } from "@/lib";

// (jsdocs)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ContractTable } from "@/tables/contract";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { LocalTable } from "@/tables/local";
import { Hex } from "viem";

/**
 * Defines the schema of a properties record inside a {@link ContractTable} or {@link LocalTable}.
 *
 * It uses a {@link Type} enum to be able to infer the TypeScript type of each property.
 *
 * @category Tables
 */
export type Schema = {
  [key: string]: Type;
};

/**
 * Defines any additional metadata that can be attached to a {@link ContractTable} or {@link LocalTable}.
 *
 * @category Tables
 */
export type Metadata =
  | {
      [key: string]: unknown;
    }
  | undefined;

/**
 * Used to specify the types for properties, and infer their TypeScript type.
 *
 * Note: This is modified from RECS.
 *
 * @category Tables
 */
export enum Type {
  Boolean,
  Number,
  OptionalNumber,
  BigInt,
  OptionalBigInt,
  String,
  OptionalString,
  NumberArray,
  OptionalNumberArray,
  BigIntArray,
  OptionalBigIntArray,
  StringArray,
  OptionalStringArray,
  Hex,
  OptionalHex,
  HexArray,
  OptionalHexArray,
  $Record,
  Optional$Record,
  $RecordArray,
  Optional$RecordArray,
  T,
  OptionalT,
}

/**
 * Defines a mapping between JavaScript {@link Type} enums and their corresponding TypeScript types.
 *
 * @category Tables
 */
export type PropertiesType<T = unknown> = {
  [Type.Boolean]: boolean;
  [Type.Number]: number;
  [Type.BigInt]: bigint;
  [Type.String]: string;
  [Type.Hex]: Hex;
  [Type.$Record]: $Record;
  [Type.NumberArray]: number[];
  [Type.BigIntArray]: bigint[];
  [Type.StringArray]: string[];
  [Type.HexArray]: Hex[];
  [Type.$RecordArray]: $Record[];
  [Type.OptionalNumber]: number | undefined;
  [Type.OptionalBigInt]: bigint | undefined;
  [Type.OptionalString]: string | undefined;
  [Type.OptionalHex]: Hex | undefined;
  [Type.Optional$Record]: $Record | undefined;
  [Type.OptionalNumberArray]: number[] | undefined;
  [Type.OptionalBigIntArray]: bigint[] | undefined;
  [Type.OptionalStringArray]: string[] | undefined;
  [Type.OptionalHexArray]: Hex[] | undefined;
  [Type.Optional$RecordArray]: $Record[] | undefined;
  [Type.T]: T;
  [Type.OptionalT]: T | undefined;
};

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
  bytes1: Type.Hex,
  bytes2: Type.Hex,
  bytes3: Type.Hex,
  bytes4: Type.Hex,
  bytes5: Type.Hex,
  bytes6: Type.Hex,
  bytes7: Type.Hex,
  bytes8: Type.Hex,
  bytes9: Type.Hex,
  bytes10: Type.Hex,
  bytes11: Type.Hex,
  bytes12: Type.Hex,
  bytes13: Type.Hex,
  bytes14: Type.Hex,
  bytes15: Type.Hex,
  bytes16: Type.Hex,
  bytes17: Type.Hex,
  bytes18: Type.Hex,
  bytes19: Type.Hex,
  bytes20: Type.Hex,
  bytes21: Type.Hex,
  bytes22: Type.Hex,
  bytes23: Type.Hex,
  bytes24: Type.Hex,
  bytes25: Type.Hex,
  bytes26: Type.Hex,
  bytes27: Type.Hex,
  bytes28: Type.Hex,
  bytes29: Type.Hex,
  bytes30: Type.Hex,
  bytes31: Type.Hex,
  bytes32: Type.Hex,
  bool: Type.Boolean,
  address: Type.Hex,
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
  "bytes1[]": Type.HexArray,
  "bytes2[]": Type.HexArray,
  "bytes3[]": Type.HexArray,
  "bytes4[]": Type.HexArray,
  "bytes5[]": Type.HexArray,
  "bytes6[]": Type.HexArray,
  "bytes7[]": Type.HexArray,
  "bytes8[]": Type.HexArray,
  "bytes9[]": Type.HexArray,
  "bytes10[]": Type.HexArray,
  "bytes11[]": Type.HexArray,
  "bytes12[]": Type.HexArray,
  "bytes13[]": Type.HexArray,
  "bytes14[]": Type.HexArray,
  "bytes15[]": Type.HexArray,
  "bytes16[]": Type.HexArray,
  "bytes17[]": Type.HexArray,
  "bytes18[]": Type.HexArray,
  "bytes19[]": Type.HexArray,
  "bytes20[]": Type.HexArray,
  "bytes21[]": Type.HexArray,
  "bytes22[]": Type.HexArray,
  "bytes23[]": Type.HexArray,
  "bytes24[]": Type.HexArray,
  "bytes25[]": Type.HexArray,
  "bytes26[]": Type.HexArray,
  "bytes27[]": Type.HexArray,
  "bytes28[]": Type.HexArray,
  "bytes29[]": Type.HexArray,
  "bytes30[]": Type.HexArray,
  "bytes31[]": Type.HexArray,
  "bytes32[]": Type.HexArray,
  "bool[]": Type.T, // no boolean arr,
  "address[]": Type.HexArray,
  bytes: Type.Hex,
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
