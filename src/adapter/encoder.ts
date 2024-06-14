import { type AbiParameterToPrimitiveType, type Hex, encodePacked } from "viem";

import { type SchemaAbiType, type StaticAbiType, staticAbiTypes } from "@/lib/external/mud/schema";

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

type ArrayToStaticAbiType<abiType extends string> = abiType extends `${infer StaticAbiType}[]` ? StaticAbiType : never;
const arrayToStaticAbiType = <abiType extends ArrayAbiType>(abiType: abiType): ArrayToStaticAbiType<abiType> => {
  return abiType.replace(arrayPattern, "") as ArrayToStaticAbiType<abiType>;
};

type ArrayAbiType = `${StaticAbiType}[]`;
const arrayPattern = /\[\]$/;
const isArrayAbiType = (abiType: unknown): abiType is ArrayAbiType => {
  return (
    typeof abiType === "string" && arrayPattern.test(abiType) && isStaticAbiType(abiType.replace(arrayPattern, ""))
  );
};

const isStaticAbiType = (abiType: unknown): abiType is StaticAbiType => {
  return staticAbiTypes.includes(abiType as StaticAbiType);
};
