import { LocalSyncTables, OnSyncCallbacks, Sync as SyncType } from "@test/utils/sync/types";
import { SyncSourceType, SyncStep } from "@test/utils/sync/tables";

export const hydrateFromRpc = (tables: LocalSyncTables, sync: SyncType, onSync: OnSyncCallbacks) => {
  const { SyncStatus, SyncSource } = tables;
  const { progress: onProgress, complete: onComplete, error: onError } = onSync ?? {};

  sync.start(
    (index, blockNumber, progress) => {
      SyncSource.set({ value: SyncSourceType.RPC });
      SyncStatus.set({
        step: SyncStep.Syncing,
        message: "Hydrating from RPC",
        progress,
        lastBlockNumberProcessed: blockNumber,
      });
      onProgress?.(index, blockNumber, progress);

      if (progress === 1) {
        SyncStatus.set({
          step: SyncStep.Complete,
          message: "DONE",
          progress: 1,
          lastBlockNumberProcessed: blockNumber,
        });
        onComplete?.(blockNumber);
      }
    },
    (err: unknown) => {
      onError?.(err);
      SyncStatus.set({
        step: SyncStep.Error,
        message: "Failed to hydrate from RPC",
        progress: 0,
        lastBlockNumberProcessed: BigInt(0),
      });
      console.warn("Failed to hydrate from RPC. Client may be out of sync!");
      console.error(err);
    },
  );
};

export const subToRpc = (tables: LocalSyncTables, sync: SyncType) => {
  const { SyncStatus } = tables;
  sync.start(
    (_, blockNumber) => {
      SyncStatus.set({
        step: SyncStep.Live,
        message: "Subscribed to RPC",
        progress: 1,
        lastBlockNumberProcessed: blockNumber,
      });

      console.log("Syncing updates on block:", blockNumber.toString());
    },
    (err: unknown) => {
      console.warn("Failed to subscribe to RPC. Client may be out of sync!");
      console.error(err);
    },
  );
};
