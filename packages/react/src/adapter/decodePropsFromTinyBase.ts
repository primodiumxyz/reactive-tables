import { DecodedTinyBaseType, TinyBaseFormattedType } from "@/adapter";
import { encodedDataKeys } from "@/lib";

const ignoreKey = (key: string) => encodedDataKeys.includes(key) || key.startsWith("type__");

export const decodePropsFromTinyBase = (formattedProps: TinyBaseFormattedType): DecodedTinyBaseType => {
  if (Object.keys(formattedProps).length === 0) return undefined;
  const decodedProps: DecodedTinyBaseType = {};

  Object.entries(formattedProps).forEach(([key, prop]) => {
    // Return encoded keys as is and ignore type keys
    if (!ignoreKey(key)) {
      const type = formattedProps[`type__${key}`];
      if (!type) throw new Error(`Type information missing for key: ${key}`);

      // Decode properties based on their type
      if (type === "bigint") {
        decodedProps[key] = BigInt(prop as string);
      } else if (type === "number" || type === "boolean" || type === "string") {
        // These kept their original type
        decodedProps[key] = prop;
      } else if (type === "bigint[]") {
        decodedProps[key] = JSON.parse(prop as string).map(BigInt);
      } else if (type === "number[]") {
        decodedProps[key] = JSON.parse(prop as string).map(Number);
      } else if (type === "boolean[]") {
        decodedProps[key] = JSON.parse(prop as string).map((v: string) => v === "true");
      } else if (type === "string[]") {
        decodedProps[key] = JSON.parse(prop as string);
      } else if (type === "undefined[]") {
        // Fallbacks just in case
        decodedProps[key] = JSON.parse(prop as string).map(() => undefined);
      } else if (type === "undefined") {
        decodedProps[key] = prop.toString();
      }
    }

    // Write encoded data
    encodedDataKeys.forEach((encodedKey) => {
      decodedProps[encodedKey] = formattedProps[encodedKey];
    });

    // Write the last block at which the table was synced
    const lastSynced = formattedProps.__lastSyncedAtBlock;
    decodedProps["__lastSyncedAtBlock"] = lastSynced && lastSynced !== "unknown" ? BigInt(lastSynced) : undefined;
  });

  return decodedProps;
};
