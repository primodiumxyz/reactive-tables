import { storeToV1 } from "@latticexyz/store/config/v2";
import { resolveConfig } from "@latticexyz/store/internal";

import { createContractTables, type ContractTables } from "@/tables";
import { createStorageAdapter, type StorageAdapter } from "@/adapter";
import {
  storeTableDefs,
  worldTableDefs,
  type AllTableDefs,
  type ContractTableDefs,
  type StoreConfig,
  type World,
} from "@/lib";

// (jsdocs)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createLocalTable } from "@/tables";

/**
 * Defines the options for creating a TinyBase wrapper.
 *
 * @template config The type of the configuration object specifying tables definitions for contracts codegen.
 * @template extraTableDefs The types of any additional custom definitions to generate tables for.
 * @param world The RECS world object, used for creating tables and records.
 * @param mudConfig The actual MUD configuration, usually retrieved for the contracts package.
 * @param otherTableDefs (optional) Custom definitions to generate tables for as well.
 * @param skipUpdateStream (optional) Whether to skip the initial update stream (most likely to trigger it afterwards).
 */
export type WrapperOptions<config extends StoreConfig, extraTableDefs extends ContractTableDefs | undefined> = {
  world: World;
  mudConfig: config;
  otherTableDefs?: extraTableDefs;
  shouldSkipUpdateStream?: () => boolean;
};

/**
 * The result of going through the TinyBase wrapper creation process.
 *
 * The registry is the main entry point to all kind of data retrieval and manipulation.
 *
 * @template config The type of the configuration object specifying tables definitions for contracts codegen.
 * @template tableDefs The types of the definitions used for generating tables.
 * @param tables The tables generated from all definitions (see {@link createContractTables}).
 * @param tableDefs The full definitions object, including provided MUD config and custom definitions, as well as store and world config tables.
 * @param storageAdapter The storage adapter for formatting onchain logs into TinyBase tabular data (see {@link createStorageAdapter}).
 * @param triggerUpdateStream A function to trigger the update stream on all tables and records (e.g. after completing sync).
 */
export type WrapperResult<config extends StoreConfig, extraTableDefs extends ContractTableDefs | undefined> = {
  tables: ContractTables<AllTableDefs<config, extraTableDefs>>;
  tableDefs: AllTableDefs<config, extraTableDefs>;
  storageAdapter: StorageAdapter;
  triggerUpdateStream: () => void;
};

/**
 * This function creates a wrapper for transforming MUD tables and custom tables definitions into consumable
 * objects, while abstracting the infrastructure for communicating from onchain data (logs) to
 * easily manipulable and strictly typed tables & records. More specifically:
 * - encoding/decoding MUD and custom definitions into tabular data for TinyBase;
 * - encoding data from onchain logs into tabular data records for TinyBase;
 * - decoding data into TypeScript-friendly objects, and offering typed methods for access and manipulation;
 * - creating and reacting to queries, both in TinyBase queries and RECS-like formats.
 *
 * This is the main entry point into the library.
 *
 * Note: if the wrapper is used in a browser environment, and you intend to use persistent tables, you MUST wait for the
 * sync with local storage to be started; otherwise, there will be inconsistencies with properties from the last and current sessions.
 * See the example in the {@link createLocalTable} function for more information.
 *
 * @param options The {@link WrapperOptions} object specifying the MUD configuration and custom definitions.
 * @returns A {@link WrapperResult} object containing the tables, definitions, store, queries instance, and storage adapter.
 * @example
 * This example creates a wrapper from MUD config and sets the properties for a specific record in the "Counter" table.
 *
 * ```ts
 * const mudConfig = defineWorld({
 *   tables: {
 *     Counter: {
 *       schema: {
 *         value: "uint32",
 *       },
 *       key: [],
 *     },
 *   },
 * });
 *
 * const { registry } = createWrapper({ world, mudConfig });
 * registry.Counter.set({ value: 13 }); // fully typed
 * const properties = registry.Counter.get();
 * console.log(properties);
 * // -> { value: 13 }
 * ```
 * @category Creation
 */
export const createWrapper = <config extends StoreConfig, extraTableDefs extends ContractTableDefs | undefined>({
  world,
  mudConfig,
  otherTableDefs,
  shouldSkipUpdateStream,
}: WrapperOptions<config, extraTableDefs>): WrapperResult<config, extraTableDefs> => {
  /* ------------------------------- DEFINITIONS ------------------------------ */
  // Resolve tables definitions
  const tableDefs = {
    ...resolveConfig(storeToV1(mudConfig as StoreConfig)).tables,
    ...(otherTableDefs ?? {}),
    ...storeTableDefs,
    ...worldTableDefs,
  } as unknown as AllTableDefs<config, extraTableDefs>;

  /* --------------------------------- TABLES --------------------------------- */
  // Create contract tables from the definitions (define metadata, create read/write methods, queries, and listeners APIs)
  const tables = createContractTables({ world, tableDefs });

  /* ---------------------------------- SYNC ---------------------------------- */
  // Create storage adapter (custom writer, see @primodiumxyz/sync-stack)
  // as well as a function to trigger update stream on all records for all tables (e.g. after completing sync)
  const { storageAdapter, triggerUpdateStream } = createStorageAdapter({ tables, shouldSkipUpdateStream });

  return { tables, tableDefs, storageAdapter, triggerUpdateStream };
};
