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

/**
 * Defines the options for creating a TinyBase wrapper.
 *
 * @template config The type of the configuration object specifying tables definitions for contracts codegen.
 * @template extraTableDefs The types of any additional custom definitions to generate tables for.
 * @param world The RECS world object, used for creating tables and entities.
 * @param mudConfig The actual MUD configuration, usually retrieved for the contracts package.
 * @param otherTableDefs (optional) Custom definitions to generate tables for as well.
 * @param shouldSkipUpdateStream (optional) Whether to skip the initial update stream (most likely to trigger it afterwards).
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
 * Tables are the main entry point to all kind of data retrieval and manipulation.
 *
 * @template config The type of the configuration object specifying tables definitions for contracts codegen.
 * @template tableDefs The types of the definitions used for generating tables.
 * @param tables The tables generated from all definitions (see {@link createContractTables}).
 * @param tableDefs The full definitions object, including provided MUD config and custom definitions, as well as store and world config tables.
 * @param storageAdapter The storage adapter for formatting onchain logs into TinyBase tabular data (see {@link createStorageAdapter}).
 * @param triggerUpdateStream A function to trigger the update stream on all tables and entities (e.g. after completing sync).
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
 * easily manipulable and strictly typed tables & entities. More specifically:
 * - encoding/decoding MUD and custom definitions into tabular data;
 * - encoding data from onchain logs into this specific data format;
 * - decoding data into TypeScript-friendly objects, and offering typed methods for access and manipulation;
 * - creating and reacting to queries, with the same logic as RECS but more convenient functions and types;
 *
 * This is the main entry point into the library.
 *
 * @param options The {@link WrapperOptions} object specifying the MUD configuration and custom definitions.
 * @returns A {@link WrapperResult} object containing the tables, definitions, store, queries instance, and storage adapter.
 * @example
 * This example creates a wrapper from MUD config and sets the properties for a specific entity in the "Counter" table.
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
 * const { tables } = createWrapper({ world, mudConfig });
 *
 * tables.Counter.set({ value: 13 }); // fully typed
 * const properties = tables.Counter.get();
 * console.log(properties);
 * // -> { value: 13 }
 * ```
 *
 * @example
 * This example waits for the sync with the indexer to be done before reacting to updates on tables.
 *
 * ```ts
 * const SyncProgress = createLocalTable(world, { progress: Type.Number, status: Type.Number }, { id: "SyncProgress" });
 * const { tables, storageAdapter, triggerUpdateStream } = createWrapper({
 *   world,
 *   mudConfig,
 *   shouldSkipUpdateStream: () => SyncProgress.get().status !== SyncStatus.Live,
 * });
 *
 * // Handle sync
 * const sync = createSync({
 *   ...
 *   onSyncLive: {
 *     SyncProgress.set({ progress: 100, status: SyncStatus.Live });
 *     // Trigger update stream now that all tables are synced
 *     triggerUpdateStream();
 *   },
 * });
 *
 * sync.start();
 * world.registerDisposer(sync.unsubscribe);
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
  // as well as a function to trigger update stream on all entities for all tables (e.g. after completing sync)
  const { storageAdapter, triggerUpdateStream } = createStorageAdapter({ tables, shouldSkipUpdateStream });

  return { tables, tableDefs, storageAdapter, triggerUpdateStream };
};
