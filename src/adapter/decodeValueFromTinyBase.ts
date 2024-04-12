import { DynamicPrimitiveType, StaticPrimitiveType } from "@latticexyz/schema-type/internal";
import { TinyBaseFormattedType } from "./formatValueForTinyBase";
import { Hex } from "viem";

type DecodedTinyBaseType = {
  [key: string]: DynamicPrimitiveType | StaticPrimitiveType | Hex;
};

const shouldReturnIntact = (key: string) =>
  key === "__staticData" || key === "__encodedLengths" || key === "__dynamicData";

export const decodeValueFromTinyBase = (formattedData: TinyBaseFormattedType): DecodedTinyBaseType => {
  let decoded: DecodedTinyBaseType = {};

  Object.entries(formattedData).forEach(([key, value]) => {
    // Return special keys as is
    if (shouldReturnIntact(key)) {
      decoded[key] = value as Hex;
      // Skip type information
    } else if (!key.startsWith("type__")) {
      const type = formattedData[`type__${key}`];
      if (!type) throw new Error(`Type information missing for key: ${key}`);

      // Decode values based on their type
      if (type === "bigint") {
        decoded[key] = BigInt(value as string);
      } else if (type === "number" || type === "boolean" || type === "string") {
        // These kept their original type
        decoded[key] = value;
      } else if (type === "bigint[]") {
        decoded[key] = JSON.parse(value as string).map(BigInt);
      } else if (type === "number[]") {
        decoded[key] = JSON.parse(value as string).map(Number);
      } else if (type === "boolean[]") {
        decoded[key] = JSON.parse(value as string).map((v: string) => v === "true");
      }
    }
  });

  return decoded;
};
