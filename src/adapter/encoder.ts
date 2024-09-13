import {
  type AbiParameterToPrimitiveType,
  type Hex,
  decodeAbiParameters,
  encodeAbiParameters,
  encodePacked,
} from "viem";

import { entityToHexKeyTuple, hexKeyTupleToEntity, type Entity } from "@/lib/external/mud/entity";
import {
  type AbiKeySchema,
  type AbiToSchema,
  arrayToStaticAbiType,
  isArrayAbiType,
  isStaticAbiType,
  type Properties,
  type SchemaAbiType,
  type SchemaToPrimitives,
} from "@/lib/external/mud/schema";

/* -------------------------------------------------------------------------- */
/*                                   ENTITY                                   */
/* -------------------------------------------------------------------------- */

/**
 * Concatenate a tuple of hex keys into a single entity, after encoding them into hex strings.
 *
 * Note: This is especially useful when trying to retrieve an entity using its separate key properties, as it is done in the table key
 * methods attached to contract tables (see {@link createTableKeyMethods}).
 *
 * @category Entity
 */
export const encodeEntity = <TKeySchema extends AbiKeySchema, T = unknown>(
  abiKeySchema: TKeySchema,
  keys: Properties<AbiToSchema<TKeySchema>, T>,
) => {
  if (Object.keys(abiKeySchema).length !== Object.keys(keys).length) {
    throw new Error(
      `entity length ${Object.keys(keys).length} does not match entity schema length ${Object.keys(abiKeySchema).length}`,
    );
  }

  return hexKeyTupleToEntity(
    Object.entries(abiKeySchema).map(([keyName, type]) => encodeAbiParameters([{ type }], [keys[keyName]])),
  );
};

/**
 * Decode an entity into a tuple of hex keys, after decoding them from hex strings.
 *
 * Note: This is useful for retrieving the values of each separate key property from an entity, using its schema and actual entity string.
 *
 * @category Entity
 */
export const decodeEntity = <TKeySchema extends AbiKeySchema>(
  abiKeySchema: TKeySchema,
  entity: Entity,
): SchemaToPrimitives<TKeySchema> => {
  const hexKeyTuple = entityToHexKeyTuple(entity);
  if (hexKeyTuple.length !== Object.keys(abiKeySchema).length) {
    throw new Error(
      `entity entity tuple length ${hexKeyTuple.length} does not match entity schema length ${Object.keys(abiKeySchema).length}`,
    );
  }

  return Object.fromEntries(
    Object.entries(abiKeySchema).map(([entity, type], index) => [
      entity,
      decodeAbiParameters([{ type }], hexKeyTuple[index] as Hex)[0],
    ]),
  ) as SchemaToPrimitives<TKeySchema>;
};

/* -------------------------------------------------------------------------- */
/*                                   FIELDS                                   */
/* -------------------------------------------------------------------------- */

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

/**
 * Encode static keys into a hex tuple.
 *
 * @category Schema
 */
export const encodeKeys = (abiKeySchema: AbiKeySchema, keys: Properties<AbiToSchema<AbiKeySchema>>): Hex[] => {
  const staticFields = Object.fromEntries(Object.entries(abiKeySchema).filter(([, type]) => isStaticAbiType(type)));
  return Object.entries(staticFields).map(([key, type]) => encodeAbiParameters([{ type }], [keys[key]]));
};
