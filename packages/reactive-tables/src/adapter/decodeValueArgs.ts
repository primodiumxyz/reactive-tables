// Modified from https://github.com/latticexyz/mud/blob/ade94a7fa761070719bcd4b4dac6cb8cc7783c3b/packages/protocol-parser/src/decodeValueArgs.ts#L8

import { concatHex } from "viem";
import { isDynamicAbiType, isStaticAbiType } from "@latticexyz/schema-type/internal";
import {
  decodeDynamicField,
  decodeStaticField,
  hexToEncodedLengths,
  Schema,
  SchemaToPrimitives,
  staticDataLength,
  ValueArgs,
} from "@latticexyz/protocol-parser/internal";
import { readHex } from "@latticexyz/common";
import {
  StaticPrimitiveType,
  DynamicPrimitiveType,
  staticAbiTypeToByteLength,
  dynamicAbiTypeToDefaultValue,
} from "@latticexyz/schema-type/internal";
import { Hex } from "viem";

import { encodePropertiesToTinyBase } from "@/adapter/encodePropertiesToTinyBase";
import { PropertiesSchema } from "@/tables/contract";

/**
 * Decode the properties of a record from the data inside a log.
 *
 * This is an unmodified version of the original MUD function.
 *
 * @template TSchema The schema of the properties to decode.
 * @param propertiesSchema The schema of the properties to decode.
 * @param args The encoded metadata to decode the properties from.
 * @returns The decoded properties.
 * @see [@]latticexyz/protocol-parser/internal/decodeValueArgs.ts
 * @category Adapter
 */
export function decodeValueArgs<TSchema extends PropertiesSchema>(
  propertiesSchema: TSchema,
  args: ValueArgs,
): SchemaToPrimitives<TSchema> {
  const { staticData, encodedLengths, dynamicData } = args;
  return decodeValue(
    propertiesSchema,
    concatHex([
      readHex(staticData, 0, staticDataLength(Object.values(propertiesSchema).filter(isStaticAbiType))),
      encodedLengths,
      dynamicData,
    ]),
  );
}

/**
 * Decode the properties of a record from its hex metadata.
 *
 * This is an slightly modified version of the original MUD function.
 * The only difference is that the data is encoded to fit a TinyBase table when set inside the storage adapter.
 *
 * The properties will be appended with their types (e.g. `type__count` for `count`; or { count: 1 } will produce { type__count: "number" }).
 *
 * @template TSchema The schema of the properties to decode.
 * @param propertiesSchema The schema of the properties to decode.
 * @param data The encoded hex data to decode the properties from.
 * @returns The decoded properties in a TinyBase-friendly format.
 * @see [@]latticexyz/protocol-parser/internal/decodeValue.ts
 * @see {@link encodePropertiesToTinyBase}
 * @category Adapter
 */
export function decodeValue<TSchema extends PropertiesSchema>(
  propertiesSchema: TSchema,
  data: Hex,
): SchemaToPrimitives<TSchema> {
  const staticFields = Object.values(propertiesSchema).filter(isStaticAbiType);
  const dynamicFields = Object.values(propertiesSchema).filter(isDynamicAbiType);

  const valueTuple = decodeRecord({ staticFields, dynamicFields }, data);
  // Modified: encode for TinyBase
  // This will include formatted values + their types (e.g. `type__name` for `name`)
  return encodePropertiesToTinyBase(
    Object.fromEntries(Object.keys(propertiesSchema).map((key, i) => [key, valueTuple[i]])),
  ) as SchemaToPrimitives<TSchema>;
}

/**
 * Decode the static and dynamic properties of a record from its hex data and type (dynamic or static).
 *
 * This is an unmodified version of the original MUD function.
 *
 * @param propertiesSchema The schema of the properties to decode.
 * @param data The encoded hex data to decode the properties from.
 * @returns The decoded properties.
 * @see [@]latticexyz/protocol-parser/internal/decodeRecord.ts
 * @category Adapter
 */
export function decodeRecord(
  propertiesSchema: Schema,
  data: Hex,
): readonly (StaticPrimitiveType | DynamicPrimitiveType)[] {
  const properties: (StaticPrimitiveType | DynamicPrimitiveType)[] = [];

  let bytesOffset = 0;
  propertiesSchema.staticFields.forEach((fieldType) => {
    const fieldByteLength = staticAbiTypeToByteLength[fieldType];
    const prop = decodeStaticField(fieldType, readHex(data, bytesOffset, bytesOffset + fieldByteLength));
    bytesOffset += fieldByteLength;
    properties.push(prop);
  });

  // Warn user if static data length doesn't match the value schema, because data corruption might be possible.
  const schemaStaticDataLength = staticDataLength(propertiesSchema.staticFields);
  const actualStaticDataLength = bytesOffset;
  if (actualStaticDataLength !== schemaStaticDataLength) {
    console.warn(
      "Decoded static data length does not match value schema's expected static data length. Data may get corrupted. Is `getStaticByteLength` outdated?",
      {
        expectedLength: schemaStaticDataLength,
        actualLength: actualStaticDataLength,
        bytesOffset,
      },
    );
  }

  if (propertiesSchema.dynamicFields.length > 0) {
    const dataLayout = hexToEncodedLengths(readHex(data, bytesOffset, bytesOffset + 32));
    bytesOffset += 32;

    propertiesSchema.dynamicFields.forEach((fieldType, i) => {
      const dataLength = dataLayout.fieldByteLengths[i];
      if (dataLength > 0) {
        const prop = decodeDynamicField(fieldType, readHex(data, bytesOffset, bytesOffset + dataLength));
        bytesOffset += dataLength;
        properties.push(prop);
      } else {
        properties.push(dynamicAbiTypeToDefaultValue[fieldType]);
      }
    });

    // Warn user if dynamic data length doesn't match the dynamic data length, because data corruption might be possible.
    const actualDynamicDataLength = bytesOffset - 32 - actualStaticDataLength;
    // TODO(MUD): refactor this so we don't break for bytes offsets >UINT40
    if (BigInt(actualDynamicDataLength) !== dataLayout.totalByteLength) {
      console.warn(
        "Decoded dynamic data length does not match data layout's expected data length. Data may get corrupted. Did the data layout change?",
        {
          expectedLength: dataLayout.totalByteLength,
          actualLength: actualDynamicDataLength,
          bytesOffset,
        },
      );
    }
  }

  return properties;
}
