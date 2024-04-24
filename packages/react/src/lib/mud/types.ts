import { Entity } from "@latticexyz/recs";

/**
 * Type enum is used to specify value types to be able to access type values in JavaScript in addition to TypeScript type checks.
 * @see MUD
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
  Entity,
  OptionalEntity,
  EntityArray,
  OptionalEntityArray,
  T,
  OptionalT,
}

/**
 * Used to define the schema of a {@link ContractTable} or {@link InternalTable}.
 * Uses {@link Type} enum to be able to access the component type in JavaScript as well as have TypeScript type checks.
 * @see MUD
 */
export type Schema = {
  [key: string]: Type;
};

/**
 * Mapping between JavaScript {@link Type} enum and corresponding TypeScript type.
 * @see MUD
 */
export type ValueType<T = unknown> = {
  [Type.Boolean]: boolean;
  [Type.Number]: number;
  [Type.BigInt]: bigint;
  [Type.String]: string;
  [Type.NumberArray]: number[];
  [Type.BigIntArray]: bigint[];
  [Type.StringArray]: string[];
  [Type.Entity]: Entity;
  [Type.EntityArray]: Entity[];
  [Type.OptionalNumber]: number | undefined;
  [Type.OptionalBigInt]: bigint | undefined;
  [Type.OptionalBigIntArray]: bigint[] | undefined;
  [Type.OptionalString]: string | undefined;
  [Type.OptionalNumberArray]: number[] | undefined;
  [Type.OptionalStringArray]: string[] | undefined;
  [Type.OptionalEntity]: Entity | undefined;
  [Type.OptionalEntityArray]: Entity[] | undefined;
  [Type.T]: T;
  [Type.OptionalT]: T | undefined;
};

// Add arbitrary metadata to the table
export type Metadata =
  | {
      [key: string]: unknown;
    }
  | undefined;
