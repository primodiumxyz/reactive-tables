import { $Record } from "@/lib";

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
  $Record,
  Optional$Record,
  $RecordArray,
  Optional$RecordArray,
  T,
  OptionalT,
}

/**
 * Used to define the schema of a {@link ContractTable} or {@link LocalTable}.
 * Uses {@link Type} enum to be able to access the tables type in JavaScript as well as have TypeScript type checks.
 * @see MUD
 */
export type Schema = {
  [key: string]: Type;
};

/**
 * Mapping between JavaScript {@link Type} enum and corresponding TypeScript type.
 * @see MUD
 */
export type PropsType<T = unknown> = {
  [Type.Boolean]: boolean;
  [Type.Number]: number;
  [Type.BigInt]: bigint;
  [Type.String]: string;
  [Type.NumberArray]: number[];
  [Type.BigIntArray]: bigint[];
  [Type.StringArray]: string[];
  [Type.$Record]: $Record;
  [Type.$RecordArray]: $Record[];
  [Type.OptionalNumber]: number | undefined;
  [Type.OptionalBigInt]: bigint | undefined;
  [Type.OptionalBigIntArray]: bigint[] | undefined;
  [Type.OptionalString]: string | undefined;
  [Type.OptionalNumberArray]: number[] | undefined;
  [Type.OptionalStringArray]: string[] | undefined;
  [Type.Optional$Record]: $Record | undefined;
  [Type.Optional$RecordArray]: $Record[] | undefined;
  [Type.T]: T;
  [Type.OptionalT]: T | undefined;
};

// Add arbitrary metadata to the table
export type Metadata =
  | {
      [key: string]: unknown;
    }
  | undefined;
