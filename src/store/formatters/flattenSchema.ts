// Copied from https://github.com/latticexyz/mud/blob/ade94a7fa761070719bcd4b4dac6cb8cc7783c3b/packages/store-sync/src/flattenSchema.ts
import { mapObject } from "@latticexyz/common/utils";
import { ValueSchema } from "@latticexyz/store/internal";

export function flattenSchema<schema extends ValueSchema>(
  schema: schema,
): { readonly [k in keyof schema]: schema[k]["type"] } {
  return mapObject(schema, (value) => value.type);
}
