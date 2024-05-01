export { createCustomWriter as createStorageAdapter } from "@/adapter/createCustomWriter";
export * from "@/adapter/types";

import { decodeValueArgs } from "@/adapter/decodeValueArgs";
import { decodePropertiesFromTinyBase } from "@/adapter/decodePropertiesFromTinyBase";
import { encodePropertiesToTinyBase } from "@/adapter/encodePropertiesToTinyBase";

export const TinyBaseAdapter = {
  decodeArgs: decodeValueArgs,
  decode: decodePropertiesFromTinyBase,
  encode: encodePropertiesToTinyBase,
};
