import { q as TinyBaseFormattedType, D as DecodedTinyBaseType, r as Primitive } from "./types-B_aAM57w.js";
export {
  v as $recordToHexKeyTuple,
  s as decode$Record,
  t as encode$Record,
  u as hexKeyTupleTo$Record,
  w as schemaAbiTypeToRecsType,
} from "./types-B_aAM57w.js";
import { ValueSchema, ValueArgs, SchemaToPrimitives } from "@latticexyz/protocol-parser/internal";
import { Hex } from "viem";
import { Store } from "tinybase/store";
import "@latticexyz/schema-type/internal";
import "@latticexyz/store/internal";
import "@latticexyz/store";
import "@latticexyz/store/config";
import "@latticexyz/store/config/v2";
import "tinybase/queries";

/**
 * UUID.core.js - UUID.js for Minimalists
 *
 * @file
 * @author  LiosK
 * @version v4.2.0
 * @license Apache License 2.0: Copyright (c) 2010-2018 LiosK
 * @url https://github.com/LiosK/UUID.js/blob/master/src/uuid.core.js
 */
/**
 * @class
 * @classdesc {@link UUID} object.
 * @hideconstructor
 */
/**
 * Generates a version 4 UUID as a hexadecimal string.
 * @returns {string} Hexadecimal UUID string.
 */
declare const uuid: () => string;

/**
 * Get the properties schema of a table stored inside the TinyBase store.
 *
 * Note: This is used when decoding logs inside the storage adapter, as it requires the properties schema to decode each property.
 *
 * @param store The regular TinyBase store.
 * @param tableId The id of the table for which to get the properties schema.
 * @returns The properties schema of the table.
 * @category Adapter
 */
declare const getPropertiesSchema: (store: Store, tableId: Hex) => ValueSchema;

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
declare function decodeValueArgs<TSchema extends ValueSchema>(
  propertiesSchema: TSchema,
  args: ValueArgs,
): SchemaToPrimitives<TSchema>;

declare const TinyBaseAdapter: {
  decodeArgs: typeof decodeValueArgs;
  decode: (formattedProperties: TinyBaseFormattedType) => DecodedTinyBaseType;
  encode: (properties: Record<string, Primitive>) => TinyBaseFormattedType;
};

export { TinyBaseAdapter, getPropertiesSchema, uuid };
