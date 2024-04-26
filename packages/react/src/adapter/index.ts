export { createCustomWriter as createStorageAdapter } from "@/adapter/createCustomWriter";
export * from "@/adapter/types";

import { decodeValueArgs } from "@/adapter/decodeValueArgs";
import { decodePropsFromTinyBase } from "@/adapter/decodePropsFromTinyBase";
import { encodePropsToTinyBase } from "@/adapter/encodePropsToTinyBase";

export const TinyBaseAdapter = {
  decodeArgs: decodeValueArgs,
  parse: decodePropsFromTinyBase,
  format: encodePropsToTinyBase,
};
