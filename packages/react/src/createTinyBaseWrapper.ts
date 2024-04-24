import { Store as StoreConfig } from "@latticexyz/store";
import { storeToV1 } from "@latticexyz/store/config/v2";
import { resolveConfig } from "@latticexyz/store/internal";
import { createStore } from "tinybase/store";
import { createQueries } from "tinybase/queries";

import { MUDTables } from "@/components/types";
import { createComponentsStore } from "@/components";
import { createStorageAdapter } from "@/adapter";
import { TinyBaseWrapperOptions, TinyBaseWrapperResult, AllTables } from "@/types";

import storeConfig from "@latticexyz/store/mud.config";
import worldConfig from "@latticexyz/world/mud.config";
export const storeTables = resolveConfig(storeToV1(storeConfig)).tables;
export const worldTables = resolveConfig(storeToV1(worldConfig)).tables;

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
