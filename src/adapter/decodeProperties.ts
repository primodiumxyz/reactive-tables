import { concatHex } from "viem";
import {
  decodeDynamicField,
  decodeStaticField,
  hexToEncodedLengths,
  type Schema,
  staticDataLength,
  type ValueArgs,
} from "@latticexyz/protocol-parser/internal";
import {
  type StaticPrimitiveType,
  type DynamicPrimitiveType,
  staticAbiTypeToByteLength,
  dynamicAbiTypeToDefaultValue,
} from "@latticexyz/schema-type/internal";
import { type Hex } from "viem";

import { readHex } from "@/lib/external/mud/common";
import {
  type AbiPropertiesSchema,
  type AbiToSchema,
  isDynamicAbiType,
  isStaticAbiType,
  type Properties,
} from "@/lib/external/mud/schema";

// Modified from https://github.com/latticexyz/mud/blob/ade94a7fa761070719bcd4b4dac6cb8cc7783c3b/packages/protocol-parser/src/decodePropertiesArgs.ts#L8

/**
 * Decode the properties of an entity from the data inside a log.
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
export function decodePropertiesArgs<TSchema extends AbiPropertiesSchema>(
  propertiesSchema: TSchema,
  args: ValueArgs,
): Properties<AbiToSchema<TSchema>> {
  const { staticData, encodedLengths, dynamicData } = args;
  return decodeProperties(
    propertiesSchema,
    concatHex([
      readHex(staticData, 0, staticDataLength(Object.values(propertiesSchema).filter(isStaticAbiType))),
      encodedLengths,
      dynamicData,
    ]),
  );
}

/**
 * Decode the properties of an entity from its hex metadata.
 *
 * This is an unmodified version of the original MUD function.
 *
 * @template TSchema The schema of the properties to decode.
 * @param propertiesSchema The schema of the properties to decode.
 * @param data The encoded hex data to decode the properties from.
 * @returns The decoded properties in a TinyBase-friendly format.
 * @see [@]latticexyz/protocol-parser/internal/decodeValue.ts
 * @category Adapter
 */
export function decodeProperties<TSchema extends AbiPropertiesSchema>(
  propertiesSchema: TSchema,
  data: Hex,
): Properties<AbiToSchema<TSchema>> {
  const staticFields = Object.values(propertiesSchema).filter(isStaticAbiType);
  const dynamicFields = Object.values(propertiesSchema).filter(isDynamicAbiType);

  const valueTuple = decodeRecord({ staticFields, dynamicFields }, data);
  return Object.fromEntries(Object.keys(propertiesSchema).map((name, i) => [name, valueTuple[i]])) as Properties<
    AbiToSchema<TSchema>
  >;
}

/**
 * Decode the static and dynamic properties of an entity from its hex data and type (dynamic or static).
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
