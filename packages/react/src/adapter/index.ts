export {
  createCustomWriter as createStorageAdapter,
  CustomWriter as StorageAdapter,
} from "@/adapter/createCustomWriter";
export { type TinyBaseFormattedType } from "@/adapter/formatValueForTinyBase";

import { decodeValueArgs } from "@/adapter/decodeValueArgs";
import { decodeValueFromTinyBase } from "@/adapter/decodeValueFromTinyBase";
import { formatValueForTinyBase } from "@/adapter/formatValueForTinyBase";

export const TinyBaseAdapter = {
  decodeArgs: decodeValueArgs,
  parse: decodeValueFromTinyBase,
  format: formatValueForTinyBase,
};
