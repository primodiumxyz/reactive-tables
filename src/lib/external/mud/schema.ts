import type { SchemaAbiTypeToPrimitiveType } from "@latticexyz/schema-type/internal";
import type { Hex } from "viem";

import type { Entity } from "@/lib";

/* -------------------------------------------------------------------------- */
/*                                   SCHEMAS                                  */
/* -------------------------------------------------------------------------- */

/**
 * Defines the schema of a properties entity inside a {@link Table} or {@link BaseTable}.
 *
 * It uses a {@link Type} enum to be able to infer the TypeScript type of each property.
 *
 * @category Tables
 */
export type Schema = {
  [key: string]: Type;
};

/**
 * Defines any additional metadata that can be attached to a {@link Table} or {@link BaseTable}.
 *
 * @category Tables
 */
export type Metadata =
  | {
      [key: string]: unknown;
    }
  | undefined;

export type UserTypes = Record<string, { internalType: SchemaAbiType }>;

export type AbiKeySchema<userTypes extends UserTypes | undefined = undefined> = Record<
  string,
  userTypes extends UserTypes ? StaticAbiType | keyof userTypes : StaticAbiType
>;
export type AbiPropertiesSchema<userTypes extends UserTypes | undefined = undefined> = Record<
  string,
  userTypes extends UserTypes ? SchemaAbiType | keyof userTypes : SchemaAbiType
>;

export type UnparsedAbiKeySchema = {
  readonly [k: string]: {
    readonly type: StaticAbiType;
  };
};
export type UnparsedAbiPropertiesSchema = {
  readonly [k: string]: {
    readonly type: SchemaAbiType;
  };
};

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

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
  Entity,
  OptionalEntity,
  EntityArray,
  OptionalEntityArray,
  T,
  OptionalT,
}

/**
 * Defines a mapping between JavaScript {@link Type} enums and their corresponding TypeScript types.
 *
 * @category Tables
 */
export type MappedType<T = unknown> = {
  [Type.Boolean]: boolean;
  [Type.Number]: number;
  [Type.BigInt]: bigint;
  [Type.String]: string;
  [Type.Hex]: Hex;
  [Type.Entity]: Entity;
  [Type.NumberArray]: number[];
  [Type.BigIntArray]: bigint[];
  [Type.StringArray]: string[];
  [Type.HexArray]: Hex[];
  [Type.EntityArray]: Entity[];
  [Type.OptionalNumber]: number | undefined;
  [Type.OptionalBigInt]: bigint | undefined;
  [Type.OptionalString]: string | undefined;
  [Type.OptionalHex]: Hex | undefined;
  [Type.OptionalEntity]: Entity | undefined;
  [Type.OptionalNumberArray]: number[] | undefined;
  [Type.OptionalBigIntArray]: bigint[] | undefined;
  [Type.OptionalStringArray]: string[] | undefined;
  [Type.OptionalHexArray]: Hex[] | undefined;
  [Type.OptionalEntityArray]: Entity[] | undefined;
  [Type.T]: T;
  [Type.OptionalT]: T | undefined;
};

/**
 * Helper constant with all optional {@link Type}s.
 */
export const OptionalTypes = [
  Type.OptionalEntity,
  Type.OptionalEntityArray,
  Type.OptionalNumber,
  Type.OptionalNumberArray,
  Type.OptionalBigInt,
  Type.OptionalBigIntArray,
  Type.OptionalString,
  Type.OptionalStringArray,
  Type.OptionalHex,
  Type.OptionalHexArray,
  Type.OptionalT,
];

/**
 * Defines the Solidity types for later conversion to TypeScript types.
 *
 * Note: This is copied from the RECS library.
 *
 * @see [@]latticexyz/schema-type/schemaAbiTypes.ts
 */
export const schemaAbiTypes = [
  "uint8",
  "uint16",
  "uint24",
  "uint32",
  "uint40",
  "uint48",
  "uint56",
  "uint64",
  "uint72",
  "uint80",
  "uint88",
  "uint96",
  "uint104",
  "uint112",
  "uint120",
  "uint128",
  "uint136",
  "uint144",
  "uint152",
  "uint160",
  "uint168",
  "uint176",
  "uint184",
  "uint192",
  "uint200",
  "uint208",
  "uint216",
  "uint224",
  "uint232",
  "uint240",
  "uint248",
  "uint256",
  "int8",
  "int16",
  "int24",
  "int32",
  "int40",
  "int48",
  "int56",
  "int64",
  "int72",
  "int80",
  "int88",
  "int96",
  "int104",
  "int112",
  "int120",
  "int128",
  "int136",
  "int144",
  "int152",
  "int160",
  "int168",
  "int176",
  "int184",
  "int192",
  "int200",
  "int208",
  "int216",
  "int224",
  "int232",
  "int240",
  "int248",
  "int256",
  "bytes1",
  "bytes2",
  "bytes3",
  "bytes4",
  "bytes5",
  "bytes6",
  "bytes7",
  "bytes8",
  "bytes9",
  "bytes10",
  "bytes11",
  "bytes12",
  "bytes13",
  "bytes14",
  "bytes15",
  "bytes16",
  "bytes17",
  "bytes18",
  "bytes19",
  "bytes20",
  "bytes21",
  "bytes22",
  "bytes23",
  "bytes24",
  "bytes25",
  "bytes26",
  "bytes27",
  "bytes28",
  "bytes29",
  "bytes30",
  "bytes31",
  "bytes32",
  "bool",
  "address",
  "uint8[]",
  "uint16[]",
  "uint24[]",
  "uint32[]",
  "uint40[]",
  "uint48[]",
  "uint56[]",
  "uint64[]",
  "uint72[]",
  "uint80[]",
  "uint88[]",
  "uint96[]",
  "uint104[]",
  "uint112[]",
  "uint120[]",
  "uint128[]",
  "uint136[]",
  "uint144[]",
  "uint152[]",
  "uint160[]",
  "uint168[]",
  "uint176[]",
  "uint184[]",
  "uint192[]",
  "uint200[]",
  "uint208[]",
  "uint216[]",
  "uint224[]",
  "uint232[]",
  "uint240[]",
  "uint248[]",
  "uint256[]",
  "int8[]",
  "int16[]",
  "int24[]",
  "int32[]",
  "int40[]",
  "int48[]",
  "int56[]",
  "int64[]",
  "int72[]",
  "int80[]",
  "int88[]",
  "int96[]",
  "int104[]",
  "int112[]",
  "int120[]",
  "int128[]",
  "int136[]",
  "int144[]",
  "int152[]",
  "int160[]",
  "int168[]",
  "int176[]",
  "int184[]",
  "int192[]",
  "int200[]",
  "int208[]",
  "int216[]",
  "int224[]",
  "int232[]",
  "int240[]",
  "int248[]",
  "int256[]",
  "bytes1[]",
  "bytes2[]",
  "bytes3[]",
  "bytes4[]",
  "bytes5[]",
  "bytes6[]",
  "bytes7[]",
  "bytes8[]",
  "bytes9[]",
  "bytes10[]",
  "bytes11[]",
  "bytes12[]",
  "bytes13[]",
  "bytes14[]",
  "bytes15[]",
  "bytes16[]",
  "bytes17[]",
  "bytes18[]",
  "bytes19[]",
  "bytes20[]",
  "bytes21[]",
  "bytes22[]",
  "bytes23[]",
  "bytes24[]",
  "bytes25[]",
  "bytes26[]",
  "bytes27[]",
  "bytes28[]",
  "bytes29[]",
  "bytes30[]",
  "bytes31[]",
  "bytes32[]",
  "bool[]",
  "address[]",
  "bytes",
  "string",
] as const;

/**
 * The below types and constants are copied from RECS as well.
 */
export type SchemaAbiType = (typeof schemaAbiTypes)[number];

// These are defined here to keep the index position (98) consolidated, since we use it both in runtime code and type definition
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const staticAbiTypes = schemaAbiTypes.slice(0, 98) as any as TupleSplit<typeof schemaAbiTypes, 98>[0];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const dynamicAbiTypes = schemaAbiTypes.slice(98) as any as TupleSplit<typeof schemaAbiTypes, 98>[1];

export type StaticAbiType = (typeof staticAbiTypes)[number];
export type DynamicAbiType = (typeof dynamicAbiTypes)[number];
export type AbiType = StaticAbiType | DynamicAbiType;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TupleSplit<T, N extends number, O extends readonly any[] = readonly []> = O["length"] extends N
  ? [O, T]
  : T extends readonly [infer F, ...infer R]
    ? TupleSplit<readonly [...R], N, readonly [...O, F]>
    : [O, T];

/* -------------------------------------------------------------------------- */
/*                                 CONVERSION                                 */
/* -------------------------------------------------------------------------- */

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

/** Map a table schema like `{ value: "uint256" }` to its primitive types like `{ value: bigint }` */
export type SchemaToPrimitives<TSchema extends AbiPropertiesSchema> = {
  [key in keyof TSchema]: SchemaAbiTypeToPrimitiveType<TSchema[key]>;
};

/**
 * Converts an ABI type to its corresponding Typescript-understandable type.
 *
 * @category Table
 */
export type AbiToSchema<
  schema extends UnparsedAbiKeySchema | AbiKeySchema | UnparsedAbiPropertiesSchema | AbiPropertiesSchema,
> = {
  [fieldName in keyof schema & string]: SchemaAbiTypeToRecsType<
    SchemaAbiType &
      (schema extends UnparsedAbiKeySchema | UnparsedAbiPropertiesSchema
        ? schema[fieldName]["type"]
        : schema[fieldName])
  >;
};
