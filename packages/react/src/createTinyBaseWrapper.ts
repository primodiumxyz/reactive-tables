import { Store as StoreConfig } from "@latticexyz/store";
import { storeToV1 } from "@latticexyz/store/config/v2";
import { resolveConfig } from "@latticexyz/store/internal";
import { Store, createStore } from "tinybase/store";
import { Queries, createQueries } from "tinybase/queries";

import { StorageAdapter, createStorageAdapter } from "@/adapter";
import { createComponentsStore } from "@/components";
import { ContractTables } from "@/components/contract/types";
import { AllTables, MUDTables, storeTables, worldTables } from "@/lib";

// (jsdocs)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { queryAllWithValue } from "@/queries";

/**
 * The TinyBase store instance, used for managing the state of the components, as well
 * as relevant metadata.
 *
 * @see {@link Store}
 */
export type TinyBaseStore = Store;
/**
 * The TinyBase queries instance, used for querying components and reacting to changes within a query.
 *
 * @see {@link Queries}
 * @see {@link queryAllWithValue} for an example of usage.
 */
export type TinyBaseQueries = Queries;

/**
 * Defines the options for creating a TinyBase wrapper.
 * @template config The type of the configuration object specifying tables for contracts codegen.
 * @template extraTables The types of any additional custom tables to generate components for.
 * @param mudConfig The actual MUD configuration, usually retrieved for the contracts package.
 * @param otherTables (optional) Custom tables to generate components for as well.
 */
export type TinyBaseWrapperOptions<config extends StoreConfig, extraTables extends MUDTables> = {
  mudConfig: config;
  otherTables?: extraTables;
};

/**
 * The result of going through the TinyBase wrapper creation process.
 *
 * The components are the main entry point to all kind of data retrieval and manipulation.
 * @template config The type of the configuration object specifying tables for contracts codegen.
 * @template tables The types of the tables used for generating components.
 * @param components The components generated from the contract tables (see {@link createComponentsStore}).
 * @param tables The full tables object, including provided MUD tables and custom tables, as well as store and world tables.
 * TODO: provide link to wrapper
 * @param store A wrapper around the TinyBase store, addressing either the "regular" or persistent store depending on the provided flag (see TODO).
 * @param queries The queries instance (see {@link TinyBaseQueries}).
 * @param storageAdapter The storage adapter for formatting onchain logs into TinyBase tabular data (see {@link createStorageAdapter}).
 */
export type TinyBaseWrapperResult<config extends StoreConfig, tables extends MUDTables> = {
  components: ContractTables<AllTables<config, tables>>;
  tables: AllTables<config, tables>;
  store: TinyBaseStore;
  queries: TinyBaseQueries;
  storageAdapter: StorageAdapter;
};

/**
 * This function creates a wrapper for transforming MUD tables and custom tables into consumable
 * objects, while abstracting the infrastructure for communicating from onchain data (logs) to
 * easily manipulable and strictly typed components & entity/value pairs. More specifically:
 * - encoding/decoding MUD and custom tables into tabular data for TinyBase;
 * - encoding data from onchain logs into tabular data for TinyBase;
 * - decoding data into TypeScript-friendly objects, and offering typed methods for access and manipulation;
 * - creating and reacting to queries, both in TinyBase queries and RECS-like formats.
 *
 * This is the main entry point into the library.
 * @param options The {@link TinyBaseWrapperOptions} object specifying the MUD configuration and custom tables.
 * @returns A {@link TinyBaseWrapperResult} object containing the components, tables, store, queries instance, and storage adapter.
 * @example
 * This example creates a wrapper from MUD tables and sets the value of a component.
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
 * const { components } = createTinyBaseWrapper({ mudConfig });
 * components.Counter.set({ value: 42 }); // fully typed
 * const data = components.Counter.get();
 * console.log(data);
 * // -> { value: 42 }
 * ```
 * @category Creation
 */
export const createTinyBaseWrapper = <config extends StoreConfig, extraTables extends MUDTables>({
  mudConfig,
  otherTables,
}: TinyBaseWrapperOptions<config, extraTables>): TinyBaseWrapperResult<config, extraTables> => {
  /* --------------------------------- TABLES --------------------------------- */
  // Resolve tables
  const tables = {
    ...resolveConfig(storeToV1(mudConfig as StoreConfig)).tables,
    ...(otherTables ?? {}),
    ...storeTables,
    ...worldTables,
  } as unknown as AllTables<config, extraTables>;

  /* ------------------------------- COMPONENTS ------------------------------- */
  // Create the TinyBase store
  const store = createStore();
  // and queries instance tied to the store
  const queries = createQueries(store);
  // Create components from the tables (format metadata, access/modify data using the store, perform queries)
  const components = createComponentsStore({ tables, store, queries });

  /* ---------------------------------- SYNC ---------------------------------- */
  // Create storage adapter (custom writer, see @primodiumxyz/sync-stack)
  const storageAdapter = createStorageAdapter({ store });

  return { components, tables, store, queries, storageAdapter };
};
