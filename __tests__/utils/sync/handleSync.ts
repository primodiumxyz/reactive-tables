import { LocalSyncTables, OnSyncCallbacks, Sync as SyncType } from "@test/utils/sync/types";
import { SyncStep } from "@test/utils/sync/tables";

export const hydrateFromRpc = (tables: LocalSyncTables, sync: SyncType, onSync: OnSyncCallbacks) => {
  const { SyncStatus } = tables;
  const { progress: onProgress, complete: onComplete, error: onError } = onSync ?? {};
  SyncStatus.set({
    step: SyncStep.Syncing,
    message: "Hydrating from RPC",
    progress: 0,
    lastBlockNumberProcessed: BigInt(0),
  });

  sync.start(
    (index, blockNumber, progress) => {
      onProgress?.(index, blockNumber, progress);
      SyncStatus.update({
        progress,
        lastBlockNumberProcessed: blockNumber,
      });

      if (progress === 1) {
        onComplete?.(blockNumber);
        SyncStatus.update({
          step: SyncStep.Complete,
          message: "DONE",
        });
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
      const historicalSyncComplete = SyncStatus.get()?.step === SyncStep.Complete;

      if (historicalSyncComplete) {
        SyncStatus.set({
          step: SyncStep.Live,
          message: "Subscribed to RPC",
          progress: 1,
          lastBlockNumberProcessed: blockNumber,
        });
      }

      console.log(
        historicalSyncComplete ? "Syncing updates on block:" : "Storing logs for block:",
        blockNumber.toString(),
      );
    },
    (err: unknown) => {
      console.warn("Failed to subscribe to RPC. Client may be out of sync!");
      console.error(err);
    },
  );
};
