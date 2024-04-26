import { $Record } from "@/lib";

// (jsdocs)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ContractTable } from "@/tables/contract";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { LocalTable } from "@/tables/local";

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
  $Record,
  Optional$Record,
  $RecordArray,
  Optional$RecordArray,
  T,
  OptionalT,
}

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
 * Defines a mapping between JavaScript {@link Type} enums and their corresponding TypeScript types.
 *
 * @category Tables
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
