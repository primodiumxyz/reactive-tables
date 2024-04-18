import { Store as StoreConfig } from "@latticexyz/store";
import { World } from "@latticexyz/recs";
import { storeToV1 } from "@latticexyz/store/config/v2";
import { Tables, resolveConfig } from "@latticexyz/store/internal";

import { createComponentsStore } from "@/store";
import { createStorageAdapter } from "@/adapter";
import { createPublicClient } from "@/utils";
import { TinyBaseWrapperOptions, NetworkConfig, TinyBaseWrapperResult, AllTables } from "@/types";

import { storeTables, worldTables } from "@latticexyz/store-sync";
import { internalComponentsTables } from "@/store/internal/internalComponents";

export const tinyBaseWrapper = <
  world extends World,
  config extends StoreConfig,
  networkConfig extends NetworkConfig,
  extraTables extends Tables | undefined,
>({
  world,
  mudConfig,
  networkConfig,
  otherTables,
  publicClient,
  // TODO: internalComponents
}: TinyBaseWrapperOptions<world, config, networkConfig, extraTables>): TinyBaseWrapperResult<config, extraTables> => {
  const client = publicClient ?? createPublicClient(networkConfig);

  /* --------------------------------- TABLES --------------------------------- */
  // Resolve tables
  const tables = {
    ...resolveConfig(storeToV1(mudConfig as StoreConfig)).tables,
    ...(otherTables ?? {}),
    ...storeTables,
    ...worldTables,
    ...internalComponentsTables,
  } as unknown as AllTables<config, extraTables>;

  /* ------------------------------- COMPONENTS ------------------------------- */
  const { components, store, queries } = createComponentsStore({ world, tables });

  /* ---------------------------------- SYNC ---------------------------------- */
  // Create storage adapter (custom writer, see @primodiumxyz/sync-stack)
  const storageAdapter = createStorageAdapter({ store });

  return { components, tables, store, queries, storageAdapter, publicClient: client };
};
