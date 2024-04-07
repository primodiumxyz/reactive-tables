import { Store as StoreConfig } from "@latticexyz/store";
import { World } from "@latticexyz/recs";
import { RecsStorageAdapter } from "@latticexyz/store-sync/recs";
import { storeToV1 } from "@latticexyz/store/config/v2";
import { ResolvedStoreConfig, Table, resolveConfig } from "@latticexyz/store/internal";
import { PublicClient } from "viem";

import { createComponentStore } from "@/store";
import { createSync, handleSync } from "@/sync";
import { createPublicClient } from "@/utils";
import { NetworkConfig, OnSyncCallbacks } from "@/types";

// TODO: handle type issues in tables & config
export const tinyBaseWrapper = <
  world extends World,
  config extends StoreConfig,
  networkConfig extends NetworkConfig,
  extraTables extends Record<string, Table>,
>(args: {
  world: world;
  mudConfig: config;
  networkConfig: networkConfig;
  otherTables?: extraTables;
  publicClient?: PublicClient;
  extend?: boolean; // extend components with additional methods
  startSync?: boolean; // start sync immediately
  onSync?: OnSyncCallbacks;
  // TODO: initialQueries?
}) => {
  const {
    world,
    mudConfig,
    networkConfig,
    otherTables,
    publicClient = createPublicClient(args.networkConfig),
    extend = true,
    startSync = true,
    onSync,
  } = args;

  /* --------------------------------- TABLES --------------------------------- */
  // Resolve tables
  const tables = {
    ...resolveConfig(storeToV1(mudConfig as StoreConfig)).tables,
    ...(otherTables ?? {}),
  } as ResolvedStoreConfig<storeToV1<config>>["tables"] & extraTables;

  /* ------------------------------- COMPONENTS ------------------------------- */
  let { components } = createComponentStore({ world, tables, extend }) as {
    components: RecsStorageAdapter<ResolvedStoreConfig<config>["tables"] & extraTables>["components"];
  };

  // TODO(later): copy ExtendedComponent from main repo, for each find out if it's a regular/contract component
  /**
   * Extend components if requested
   * probably can figure out by differentiating between mudConfig/otherTables? (or anything else unique to one category anyway)
   * components = extend ? extendComponents({ components }) : components;
   */

  /* ---------------------------------- SYNC ---------------------------------- */
  // Create custom writer, and setup sync
  const sync = createSync({ world, tables, networkConfig, publicClient });
  if (startSync) {
    handleSync(sync, onSync);
  }

  return { components, tables, publicClient, sync };
};
