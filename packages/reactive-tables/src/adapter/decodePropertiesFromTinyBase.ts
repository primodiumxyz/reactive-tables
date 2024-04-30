import { type Hex } from "viem";

import type { DecodedTinyBaseType, TinyBaseFormattedType } from "@/adapter";
import { localProperties, metadataProperties } from "@/lib";

// (jsdocs)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { encodePropertiesToTinyBase } from "./encodePropertiesToTinyBase";

// We can ignore these keys as they either don't need to be decoded (metadataProperties) or represent type information
const ignoreKey = (key: string) => metadataProperties.concat(localProperties).includes(key) || key.startsWith("type__");

/**
 * Decode the properties of a record from its TinyBase-formatted cells.
 *
 * This will look for the type of each property, as they were provided during encoding (see {@link encodePropertiesToTinyBase}), and decode it accordingly.
 *
 * @param formattedProperties The properties from TinyBase storage to decode.
 * @returns The decoded properties.
 * @example
 * This example decodes a simple TinyBase-formatted record.
 *
 * ```ts
 * const formattedProperties = {
 *   count: 1,
 *   type__count: "number",
 *   items: "[1, 2, 3]",
 *   type__items: "number[]",
 *   __staticData: 0x...,
 *   __dynamicData: 0x...,
 *   __encodedLengths: 0x...,
 *   __lastSyncedAtBlock: "1234567890",
 * };
 *
 * const decodedProperties = decodePropertiesFromTinyBase(formattedProperties);
 * console.log(decodedProperties);
 * // -> { count: 1, items: [1, 2, 3], __staticData: 0x..., __dynamicData: 0x..., __encodedLengths: 0x..., __lastSyncedAtBlock: 1234567890n }
 * ```
 * @category Adapter
 */
export const decodePropertiesFromTinyBase = (formattedProperties: TinyBaseFormattedType): DecodedTinyBaseType => {
  if (Object.keys(formattedProperties).length === 0) return undefined;
  const decodedProperties: DecodedTinyBaseType = {};

  Object.entries(formattedProperties).forEach(([key, prop]) => {
    // Ignore metadata keys (don't need to decode them) and type information
    if (!ignoreKey(key)) {
      // Find the type associated with this possibly encoded property
      const type = formattedProperties[`type__${key}`];
      if (!type) throw new Error(`Type information missing for key: ${key}`);

      // Decode the property based on its type
      if (type === "bigint") {
        decodedProperties[key] = BigInt(prop as string);
      } else if (type === "number" || type === "boolean" || type === "string") {
        // These kept their original type
        decodedProperties[key] = prop;
      } else if (type === "bigint[]") {
        decodedProperties[key] = JSON.parse(prop as string).map(BigInt);
      } else if (type === "number[]") {
        decodedProperties[key] = JSON.parse(prop as string).map(Number);
      } else if (type === "boolean[]") {
        decodedProperties[key] = JSON.parse(prop as string).map((v: string) => v === "true");
      } else if (type === "string[]") {
        decodedProperties[key] = JSON.parse(prop as string);
      } else if (type === "undefined[]") {
        // Fallbacks just in case
        decodedProperties[key] = JSON.parse(prop as string).map(() => undefined);
      } else if (type === "undefined") {
        decodedProperties[key] = prop.toString();
      }
    }

    // Write the metadata properties as they are
    metadataProperties.forEach((encodedKey) => {
      decodedProperties[encodedKey] = formattedProperties[encodedKey] as Hex;
    });

    // Write the last block at which the table was synced (this is either a bigint or "unknown")
    const lastSynced = formattedProperties["__lastSyncedAtBlock"];
    decodedProperties["__lastSyncedAtBlock"] = lastSynced && lastSynced !== "unknown" ? BigInt(lastSynced) : undefined;
  });

  return decodedProperties;
};
