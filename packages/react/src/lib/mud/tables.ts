import { Store as StoreConfig } from "@latticexyz/store";
import { ResolvedStoreConfig, resolveConfig } from "@latticexyz/store/config";
import { storeToV1 } from "@latticexyz/store/config/v2";

import { Table as ContractTableDef, Tables as ContractTableDefs } from "@latticexyz/store/internal";
export { ContractTableDefs, ContractTableDef };

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
export type AllTableDefs<config extends StoreConfig, extraTableDefs extends ContractTableDefs> = ResolvedStoreConfig<
  storeToV1<config>
>["tables"] &
  (extraTableDefs extends ContractTableDefs ? extraTableDefs : Record<string, never>) &
  typeof storeTableDefs &
  typeof worldTableDefs;
