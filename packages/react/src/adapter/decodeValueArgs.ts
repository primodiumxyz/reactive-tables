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

import { formatPropsForTinyBase } from "@/adapter/formatPropsForTinyBase";
import { PropsSchema } from "@/tables/contract";

export function decodeValueArgs<TSchema extends PropsSchema>(
  propsSchema: TSchema,
  { staticData, encodedLengths, dynamicData }: ValueArgs,
): SchemaToPrimitives<TSchema> {
  return decodeValue(
    propsSchema,
    concatHex([
      readHex(staticData, 0, staticDataLength(Object.values(propsSchema).filter(isStaticAbiType))),
      encodedLengths,
      dynamicData,
    ]),
  );
}

export function decodeValue<TSchema extends PropsSchema>(propsSchema: TSchema, data: Hex): SchemaToPrimitives<TSchema> {
  const staticFields = Object.values(propsSchema).filter(isStaticAbiType);
  const dynamicFields = Object.values(propsSchema).filter(isDynamicAbiType);

  const valueTuple = decodeRecord({ staticFields, dynamicFields }, data);
  // Modified: encode for TinyBase
  // This will include formatted values + their types (e.g. `type__name` for `name`)
  return formatPropsForTinyBase(Object.keys(propsSchema), valueTuple) as SchemaToPrimitives<TSchema>;
}

export function decodeRecord(propsSchema: Schema, data: Hex): readonly (StaticPrimitiveType | DynamicPrimitiveType)[] {
  const properties: (StaticPrimitiveType | DynamicPrimitiveType)[] = [];

  let bytesOffset = 0;
  propsSchema.staticFields.forEach((fieldType) => {
    const fieldByteLength = staticAbiTypeToByteLength[fieldType];
    const prop = decodeStaticField(fieldType, readHex(data, bytesOffset, bytesOffset + fieldByteLength));
    bytesOffset += fieldByteLength;
    properties.push(prop);
  });

  // Warn user if static data length doesn't match the value schema, because data corruption might be possible.
  const schemaStaticDataLength = staticDataLength(propsSchema.staticFields);
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

  if (propsSchema.dynamicFields.length > 0) {
    const dataLayout = hexToEncodedLengths(readHex(data, bytesOffset, bytesOffset + 32));
    bytesOffset += 32;

    propsSchema.dynamicFields.forEach((fieldType, i) => {
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
