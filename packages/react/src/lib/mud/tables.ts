import { Store as StoreConfig } from "@latticexyz/store";
import { ResolvedStoreConfig, resolveConfig } from "@latticexyz/store/config";
import { storeToV1 } from "@latticexyz/store/config/v2";

import { Table as MUDTable, Tables as MUDTables } from "@latticexyz/store/internal";
export { MUDTables, MUDTable };

// (jsdocs)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { WrapperOptions } from "@/createWrapper";

// Import and resolve MUD base store & world tables
import storeConfig from "@latticexyz/store/mud.config";
import worldConfig from "@latticexyz/world/mud.config";
export const storeTables = resolveConfig(storeToV1(storeConfig)).tables;
export const worldTables = resolveConfig(storeToV1(worldConfig)).tables;

/**
 * The type AllTables represents the union of tables from the provided MUD configuration, original
 * MUD store and world configs resolved into tables, and any additional tables provided by the consumer.
 *
 * This type is used to extract types out of all tables relevant to the components, to provide type safety
 * for constant data such as schemas, keys, and other table metadata (e.g. namespace).
 *
 * @template config The type of the MUD configuration tables provided to the wrapper.
 * @template extraTables The type of any additional contract tables provided to the wrapper.
 * @see {@link WrapperOptions}
 * @see {@link storeTables}
 * @see {@link worldTables}
 * @category Tables
 */
export type AllTables<config extends StoreConfig, extraTables extends MUDTables> = ResolvedStoreConfig<
  storeToV1<config>
>["tables"] &
  (extraTables extends MUDTables ? extraTables : Record<string, never>) &
  typeof storeTables &
  typeof worldTables;
