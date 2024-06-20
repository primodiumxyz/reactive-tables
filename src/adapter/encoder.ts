import { type AbiParameterToPrimitiveType, type Hex, encodePacked } from "viem";

import { arrayToStaticAbiType, isArrayAbiType, type SchemaAbiType } from "@/lib/external/mud/schema";

/**
 * Encode any field of a table schema into a hex string.
 *
 * @category Schema
 */
export const encodeField = <TSchemaAbiType extends SchemaAbiType>(
  fieldType: TSchemaAbiType,
  value: AbiParameterToPrimitiveType<{ type: TSchemaAbiType }>,
): Hex => {
  if (isArrayAbiType(fieldType) && Array.isArray(value)) {
    const staticFieldType = arrayToStaticAbiType(fieldType);
    // TODO(MUD): we can remove conditional once this is fixed: https://github.com/wagmi-dev/viem/pull/1147
    return value.length === 0
      ? "0x"
      : encodePacked(
          value.map(() => staticFieldType),
          value,
        );
  }
  return encodePacked([fieldType], [value]);
};
