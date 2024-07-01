import { createLocalTable } from "@/tables";
import { Type, World } from "@/lib";

export enum SyncStep {
  Syncing,
  Error,
  Live,
}

export const createLocalSyncTables = (world: World) => ({
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
