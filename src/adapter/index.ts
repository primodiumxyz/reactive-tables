export { createCustomWriter as createStorageAdapter, CustomWriter as StorageAdapter } from "./createCustomWriter";
export { type TinyBaseFormattedType } from "./formatValueForTinyBase";

import { decodeValueArgs } from "./decodeValueArgs";
import { decodeValueFromTinyBase } from "./decodeValueFromTinyBase";
import { formatValueForTinyBase } from "./formatValueForTinyBase";

export const TinyBaseAdapter = {
  decodeArgs: decodeValueArgs,
  parse: decodeValueFromTinyBase,
  format: formatValueForTinyBase,
};
