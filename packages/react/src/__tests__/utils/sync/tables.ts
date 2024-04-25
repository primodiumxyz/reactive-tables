import { createLocalTable, createLocalNumberTable } from "@/tables/local";
import { Store, Type } from "@/lib";

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

export const createLocalSyncTables = (store: Store) => ({
  SyncSource: createLocalNumberTable(store, {
    id: "SyncSource",
  }),
  SyncStatus: createLocalTable(
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
