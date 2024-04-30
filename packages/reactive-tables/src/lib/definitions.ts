import type { Store as MUDStoreConfig } from "@latticexyz/store";
import type { Table as MUDTableDef, Tables as MUDTableDefs } from "@latticexyz/store/internal";
import { type ResolvedStoreConfig, resolveConfig } from "@latticexyz/store/config";
import { storeToV1 } from "@latticexyz/store/config/v2";

/**
 * Defines the MUD store configuration provided to the wrapper.
 *
 * @category Tables
 */
export type StoreConfig = MUDStoreConfig;

/**
 * Defines a contract table definition initially provided to the wrapper.
 *
 * @param tableId The id of the table.
 * @param namespace The namespace of the table inside the global scope.
 * @param name The name of the table.
 * @param keySchema The schema of the keys to differenciate records.
 * @param valueSchema The schema of the properties associated with each record.
 * @category Tables
 */
export type ContractTableDef = MUDTableDef;
/**
 * Defines a mapping of strings to their {@link ContractTableDef}, as initially provided to the wrapper.
 *
 * @category Tables
 */
export type ContractTableDefs = MUDTableDefs;

// (jsdocs)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { WrapperOptions } from "@/createWrapper";

// Import and resolve MUD base store & world tables definitions
import storeConfig from "@latticexyz/store/mud.config";
import worldConfig from "@latticexyz/world/mud.config";
export const storeTableDefs = resolveConfig(storeToV1(storeConfig)).tables;
export const worldTableDefs = resolveConfig(storeToV1(worldConfig)).tables;

/**
 * Defines the union of definitions from the provided MUD configuration, original
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
