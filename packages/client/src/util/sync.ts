import { components } from "src/network/components";
import { SyncStep } from "./constants";
import { Entity } from "@latticexyz/recs";

export function createSyncHandlers(
  syncId: Entity,
  message: {
    progress: string;
    complete: string;
    error: string;
  }
) {
  return [
    (_: number, ___: bigint, progress: number) => {
      components.SyncStatus.set(
        {
          step: SyncStep.Syncing,
          progress,
          message: message.progress,
        },
        syncId
      );

      if (progress === 1) {
        components.SyncStatus.set(
          {
            step: SyncStep.Complete,
            progress,
            message: message.complete,
          },
          syncId
        );
      }
    },
    // on error
    (e: unknown) => {
      console.error(e);
      components.SyncStatus.set(
        {
          step: SyncStep.Error,
          progress: 0,
          message: message.error,
        },
        syncId
      );
    },
  ];
}
