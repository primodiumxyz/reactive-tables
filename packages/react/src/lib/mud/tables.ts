import { Store as StoreConfig } from "@latticexyz/store";
import { ResolvedStoreConfig, resolveConfig } from "@latticexyz/store/config";
import { storeToV1 } from "@latticexyz/store/config/v2";

import { Table as ContractTableDef, Tables as ContractTableDefs } from "@latticexyz/store/internal";
export { ContractTableDefs, ContractTableDef, StoreConfig };

// (jsdocs)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { WrapperOptions } from "@/createWrapper";

// Import and resolve MUD base store & world tables definitions
import storeConfig from "@latticexyz/store/mud.config";
import worldConfig from "@latticexyz/world/mud.config";
export const storeTableDefs = resolveConfig(storeToV1(storeConfig)).tables;
export const worldTableDefs = resolveConfig(storeToV1(worldConfig)).tables;

/**
 * The type AllTableDefs represents the union of definitions from the provided MUD configuration, original
 * MUD store and world configurations resolved into tables definitions, and any additional defs provided by the consumer.
 *
 * This type is used to extract types out of all tables definitions relevant to the registry, to provide type safety
 * for constant data such as schemas, keys, and other table metadata (e.g. namespace).
 *
 * @template config The type of the MUD configuration provided to the wrapper.
 * @template extraTableDefs The type of any additional contract tables definitions provided to the wrapper.
 * @see {@link WrapperOptions}
 * @see {@link storeTableDefs}
 * @see {@link worldTableDefs}
 * @category Tables
 */
export type AllTableDefs<
  config extends StoreConfig,
  extraTableDefs extends ContractTableDefs | undefined = undefined,
> = ResolvedStoreConfig<storeToV1<config>>["tables"] &
  (extraTableDefs extends ContractTableDefs ? extraTableDefs : Record<string, never>) &
  typeof storeTableDefs &
  typeof worldTableDefs;

/**
 * Utility function to map a source object to an object with the same keys but mapped values
 *
 * @param source Source object to be mapped
 * @param valueMap Mapping values of the source object to values of the target object
 * @returns An object with the same keys as the source object but mapped values
 * @from @latticexyz/utils
 */
export function mapObject<S extends { [key: string]: unknown }, T extends { [key in keyof S]: unknown }>(
  source: S,
  valueMap: (value: S[keyof S], key: keyof S) => T[keyof S],
): T {
  const target: Partial<{ [key in keyof typeof source]: T[keyof S] }> = {};
  for (const key in source) {
    target[key] = valueMap(source[key], key);
  }
  return target as T;
}
