import { DynamicPrimitiveType, StaticPrimitiveType } from "@latticexyz/schema-type/internal";

// TODO: We might want to create a small library for TinyBase/MUD—Solidity/TypeScript primitives encoding/decoding
export type TinyBaseFormattedType = {
  [key: string]: //
  // actual storage values
  | string
    | number
    | boolean
    // associated types
    | "string"
    | "number"
    | "boolean"
    | "bigint"
    | "string[]"
    | "number[]"
    | "boolean[]"
    | "bigint[]"
    | "undefined"
    | "undefined[]";
};

// We want to encode the original type as well when dealing with client components, because we
// don't have a schema to rely on. And we don't care that much about the schema, because that's TypeScript types we want.
export const formatValueForTinyBase = (
  keys: string[],
  values: readonly (StaticPrimitiveType | DynamicPrimitiveType | undefined)[] = [],
): TinyBaseFormattedType => {
  let formatted: TinyBaseFormattedType = {};

  values.forEach((value, i) => {
    const key = keys[i];
    const valueType = Array.isArray(value) ? `${typeof value[0]}[]` : typeof value;

    // Serialize arrays (bigints, numbers, booleans)
    formatted[key] = (
      Array.isArray(value)
        ? JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v))
        : typeof value === "bigint"
          ? value.toString()
          : value
    ) as TinyBaseFormattedType[keyof TinyBaseFormattedType];

    // Record type
    formatted[`type__${key}`] = valueType;
  });

  return formatted;
};
