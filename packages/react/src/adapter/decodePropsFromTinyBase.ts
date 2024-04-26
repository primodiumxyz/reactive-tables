import { Hex } from "viem";

import { DecodedTinyBaseType, TinyBaseFormattedType } from "@/adapter";
import { metadataProperties } from "@/lib";

// (jsdocs)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { encodePropsToTinyBase } from "./encodePropsToTinyBase";

// We can ignore these keys as they either don't need to be decoded (metadataProperties) or represent type information
const ignoreKey = (key: string) => metadataProperties.includes(key) || key.startsWith("type__");

/**
 * Decode the properties of a record from its TinyBase-formatted cells.
 *
 * This will look for the type of each property, as they were provided during encoding (see {@link encodePropsToTinyBase}), and decode it accordingly.
 *
 * @param formattedProps The properties from TinyBase storage to decode.
 * @returns The decoded properties.
 * @example
 * This example decodes a simple TinyBase-formatted record.
 *
 * ```ts
 * const formattedProps = {
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
 * const decodedProps = decodePropsFromTinyBase(formattedProps);
 * console.log(decodedProps);
 * // -> { count: 1, items: [1, 2, 3], __staticData: 0x..., __dynamicData: 0x..., __encodedLengths: 0x..., __lastSyncedAtBlock: 1234567890n }
 * ```
 * @category Adapter
 */
export const decodePropsFromTinyBase = (formattedProps: TinyBaseFormattedType): DecodedTinyBaseType => {
  if (Object.keys(formattedProps).length === 0) return undefined;
  const decodedProps: DecodedTinyBaseType = {};

  Object.entries(formattedProps).forEach(([key, prop]) => {
    // Ignore metadata keys (don't need to decode them) and type information
    if (!ignoreKey(key)) {
      // Find the type associated with this possibly encoded property
      const type = formattedProps[`type__${key}`];
      if (!type) throw new Error(`Type information missing for key: ${key}`);

      // Decode the property based on its type
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

    // Write the metadata properties as they are
    metadataProperties.forEach((encodedKey) => {
      decodedProps[encodedKey] = formattedProps[encodedKey] as Hex;
    });

    // Write the last block at which the table was synced (this is either a bigint or "unknown")
    const lastSynced = formattedProps["__lastSyncedAtBlock"];
    decodedProps["__lastSyncedAtBlock"] = lastSynced && lastSynced !== "unknown" ? BigInt(lastSynced) : undefined;
  });

  return decodedProps;
};
