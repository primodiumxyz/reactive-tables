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
  ValueSchema,
} from "@latticexyz/protocol-parser/internal";
import { readHex } from "@latticexyz/common";
import {
  StaticPrimitiveType,
  DynamicPrimitiveType,
  staticAbiTypeToByteLength,
  dynamicAbiTypeToDefaultValue,
} from "@latticexyz/schema-type/internal";
import { Hex } from "viem";

import { formatValueForTinyBase } from "@/adapter/formatValueForTinyBase";

export function decodeValueArgs<TSchema extends ValueSchema>(
  valueSchema: TSchema,
  { staticData, encodedLengths, dynamicData }: ValueArgs,
): SchemaToPrimitives<TSchema> {
  return decodeValue(
    valueSchema,
    concatHex([
      readHex(staticData, 0, staticDataLength(Object.values(valueSchema).filter(isStaticAbiType))),
      encodedLengths,
      dynamicData,
    ]),
  );
}

export function decodeValue<TSchema extends ValueSchema>(valueSchema: TSchema, data: Hex): SchemaToPrimitives<TSchema> {
  const staticFields = Object.values(valueSchema).filter(isStaticAbiType);
  const dynamicFields = Object.values(valueSchema).filter(isDynamicAbiType);

  const valueTuple = decodeRecord({ staticFields, dynamicFields }, data);
  // Modified: encode for TinyBase
  // This will include formatted values + their types (e.g. `type__name` for `name`)
  return formatValueForTinyBase(Object.keys(valueSchema), valueTuple) as SchemaToPrimitives<TSchema>;
}

export function decodeRecord(valueSchema: Schema, data: Hex): readonly (StaticPrimitiveType | DynamicPrimitiveType)[] {
  const values: (StaticPrimitiveType | DynamicPrimitiveType)[] = [];

  let bytesOffset = 0;
  valueSchema.staticFields.forEach((fieldType) => {
    const fieldByteLength = staticAbiTypeToByteLength[fieldType];
    const value = decodeStaticField(fieldType, readHex(data, bytesOffset, bytesOffset + fieldByteLength));
    bytesOffset += fieldByteLength;
    values.push(value);
  });

  // Warn user if static data length doesn't match the value schema, because data corruption might be possible.
  const schemaStaticDataLength = staticDataLength(valueSchema.staticFields);
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

  if (valueSchema.dynamicFields.length > 0) {
    const dataLayout = hexToEncodedLengths(readHex(data, bytesOffset, bytesOffset + 32));
    bytesOffset += 32;

    valueSchema.dynamicFields.forEach((fieldType, i) => {
      const dataLength = dataLayout.fieldByteLengths[i];
      if (dataLength > 0) {
        const value = decodeDynamicField(fieldType, readHex(data, bytesOffset, bytesOffset + dataLength));
        bytesOffset += dataLength;
        values.push(value);
      } else {
        values.push(dynamicAbiTypeToDefaultValue[fieldType]);
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

  return values;
}
