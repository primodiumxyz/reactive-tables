import { DynamicPrimitiveType, StaticPrimitiveType } from "@latticexyz/schema-type/internal";
import { Hex } from "viem";

import { TinyBaseFormattedType } from "@/adapter/formatValueForTinyBase";
import { encodedDataKeys } from "@/lib";

type DecodedTinyBaseType =
  | {
      [key: string]: DynamicPrimitiveType | StaticPrimitiveType | Hex | undefined;
    }
  | undefined;

const ignoreKey = (key: string) => encodedDataKeys.includes(key) || key.startsWith("type__");

export const decodeValueFromTinyBase = (formattedData: TinyBaseFormattedType): DecodedTinyBaseType => {
  if (Object.keys(formattedData).length === 0) return undefined;
  const decoded: DecodedTinyBaseType = {};

  Object.entries(formattedData).forEach(([key, value]) => {
    // Return encoded keys as is and ignore type keys
    if (!ignoreKey(key)) {
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
      } else if (type === "string[]") {
        decoded[key] = JSON.parse(value as string);
      } else if (type === "undefined[]") {
        // Fallbacks just in case
        decoded[key] = JSON.parse(value as string).map(() => undefined);
      } else if (type === "undefined") {
        decoded[key] = value.toString();
      }
    }

    // Write encoded data
    encodedDataKeys.forEach((encodedKey) => {
      decoded[encodedKey] = formattedData[encodedKey];
    });

    // Write the last block at which the component was synced
    const lastSynced = formattedData.__lastSyncedAtBlock;
    decoded["__lastSyncedAtBlock"] = lastSynced && lastSynced !== "unknown" ? BigInt(lastSynced) : undefined;
  });

  return decoded;
};
