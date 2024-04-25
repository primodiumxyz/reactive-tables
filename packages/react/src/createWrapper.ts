import { Store as StoreConfig } from "@latticexyz/store";
import { storeToV1 } from "@latticexyz/store/config/v2";
import { resolveConfig } from "@latticexyz/store/internal";

import { ContractTables, createRegistry } from "@/tables/contract";
import { StorageAdapter, createStorageAdapter } from "@/adapter";
import { AllTableDefs, createStore, ContractTableDefs, Store, storeTableDefs, worldTableDefs } from "@/lib";

/**
 * Defines the options for creating a TinyBase wrapper.
 * @template config The type of the configuration object specifying tables definitions for contracts codegen.
 * @template extraTableDefs The types of any additional custom definitions to generate tables for.
 * @param mudConfig The actual MUD configuration, usually retrieved for the contracts package.
 * @param otherTableDefs (optional) Custom definitions to generate tables for as well.
 */
export type WrapperOptions<config extends StoreConfig, extraTableDefs extends ContractTableDefs> = {
  mudConfig: config;
  otherTableDefs?: extraTableDefs;
};

/**
 * The result of going through the TinyBase wrapper creation process.
 *
 * The registry is the main entry point to all kind of data retrieval and manipulation.
 * @template config The type of the configuration object specifying tables definitions for contracts codegen.
 * @template tableDefs The types of the definitions used for generating tables.
 * @param registry The tables generated from all definitions (see {@link createRegistry}).
 * @param tableDefs The full definitions object, including provided MUD config and custom definitions, as well as store and world config tables.
 * @param store A wrapper around the TinyBase store, addressing either the "regular" or persistent store depending on the provided key,
 * as well as the queries instance (see {@link createStore}).
 * @param storageAdapter The storage adapter for formatting onchain logs into TinyBase tabular data (see {@link createStorageAdapter}).
 */
export type WrapperResult<config extends StoreConfig, tableDefs extends ContractTableDefs> = {
  registry: ContractTables<AllTableDefs<config, tableDefs>>;
  tableDefs: AllTableDefs<config, tableDefs>;
  store: Store;
  storageAdapter: StorageAdapter;
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
 * @param options The {@link WrapperOptions} object specifying the MUD configuration and custom definitions.
 * @returns A {@link WrapperResult} object containing the tables, definitions, store, queries instance, and storage adapter.
 * @example
 * This example creates a wrapper from MUD config and sets the properties for a specific record in the "Counter" table.
 *
 * ```js
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
 * const { registry } = createWrapper({ mudConfig });
 * registry.Counter.set({ value: 13 }); // fully typed
 * const properties = registry.Counter.get();
 * console.log(properties);
 * // -> { value: 13 }
 * ```
 * @category Creation
 */
export const createWrapper = <config extends StoreConfig, extraTableDefs extends ContractTableDefs>({
  mudConfig,
  otherTableDefs,
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
  // Create the TinyBase store wrapper and queries instance
  const store = createStore();
  // Create tables registry from the definitions (format metadata, access/modify data using the store, perform queries)
  const registry = createRegistry({ tableDefs, store: store(), queries: store().getQueries() });

  /* ---------------------------------- SYNC ---------------------------------- */
  // Create storage adapter (custom writer, see @primodiumxyz/sync-stack)
  const storageAdapter = createStorageAdapter({ store: store() });

  return { registry, tableDefs, store, storageAdapter };
};
