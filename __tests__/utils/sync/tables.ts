import { createLocalTable, createLocalNumberTable } from "@/tables";
import { Type, World } from "@/lib";

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

export const createLocalSyncTables = (world: World) => ({
  SyncSource: createLocalNumberTable(world, {
    id: "SyncSource",
  }),
  SyncStatus: createLocalTable(
    world,
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
