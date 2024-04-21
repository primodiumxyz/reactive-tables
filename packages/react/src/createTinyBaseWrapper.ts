import { World } from "@latticexyz/recs";
import { Store as StoreConfig } from "@latticexyz/store";
import { storeToV1 } from "@latticexyz/store/config/v2";
import { resolveConfig } from "@latticexyz/store/internal";

import { createComponentsStore } from "@/store";
import { createStorageAdapter } from "@/adapter";
import { createPublicClient } from "@/utils";
import { TinyBaseWrapperOptions, NetworkConfig, TinyBaseWrapperResult, AllTables, ExtraTables } from "@/types";

import storeConfig from "@latticexyz/store/mud.config";
import worldConfig from "@latticexyz/world/mud.config";
export const storeTables = resolveConfig(storeToV1(storeConfig)).tables;
export const worldTables = resolveConfig(storeToV1(worldConfig)).tables;

export const createTinyBaseWrapper = <
  world extends World,
  config extends StoreConfig,
  networkConfig extends NetworkConfig,
  extraTables extends ExtraTables,
>({
  world,
  mudConfig,
  networkConfig,
  otherTables,
  publicClient,
}: TinyBaseWrapperOptions<world, config, networkConfig, extraTables>): TinyBaseWrapperResult<config, extraTables> => {
  const client = publicClient ?? createPublicClient(networkConfig);

  /* --------------------------------- TABLES --------------------------------- */
  // Resolve tables
  const tables = {
    ...resolveConfig(storeToV1(mudConfig as StoreConfig)).tables,
    ...(otherTables ?? {}),
    ...storeTables,
    ...worldTables,
  } as unknown as AllTables<config, extraTables>;

  /* ------------------------------- COMPONENTS ------------------------------- */
  const { components, store, queries } = createComponentsStore({ world, tables });

  /* ---------------------------------- SYNC ---------------------------------- */
  // Create storage adapter (custom writer, see @primodiumxyz/sync-stack)
  const storageAdapter = createStorageAdapter({ store });

  return { components, tables, store, queries, storageAdapter, publicClient: client };
};