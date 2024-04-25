export { createCustomWriter as createStorageAdapter } from "@/adapter/createCustomWriter";
export * from "@/adapter/types";

import { decodeValueArgs } from "@/adapter/decodeValueArgs";
import { decodePropsFromTinyBase } from "@/adapter/decodePropsFromTinyBase";
import { formatPropsForTinyBase } from "@/adapter/formatPropsForTinyBase";

export const TinyBaseAdapter = {
  decodeArgs: decodeValueArgs,
  parse: decodePropsFromTinyBase,
  format: formatPropsForTinyBase,
};
