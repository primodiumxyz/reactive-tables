import { Type } from "@latticexyz/recs";

import { createInternalComponent, createInternalNumberComponent } from "@/components/internal";
import { Store } from "@/lib";

export enum SyncSourceType {
  Indexer,
  RPC,
}

export enum SyncStep {
  Syncing,
  Error,
  Complete,
  Live,
}

export const createInternalSyncComponents = (store: Store) => ({
  SyncSource: createInternalNumberComponent(store, {
    id: "SyncSource",
  }),
  SyncStatus: createInternalComponent(
    store,
    {
      step: Type.Number,
      message: Type.String,
      progress: Type.Number,
      lastBlockNumberProcessed: Type.BigInt,
    },
    {
      id: "SyncStatus",
    },
  ),
});
