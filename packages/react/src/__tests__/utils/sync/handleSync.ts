import { NetworkConfig } from "@/__tests__/utils/init";
import { OnSyncCallbacks, Sync as SyncType } from "@/__tests__/utils/sync/types";
import { SyncSourceType, SyncStep, createLocalSyncTables } from "@/__tests__/utils/sync/tables";

export const hydrateFromIndexer = (
  components: ReturnType<typeof createLocalSyncTables>,
  networkConfig: NetworkConfig,
  sync: SyncType,
  onSync: OnSyncCallbacks,
) => {
  const { SyncSource, SyncStatus } = components;
  const { progress: onProgress, complete: onComplete, error: onError } = onSync;

  let startBlock = networkConfig.initialBlockNumber;

  sync.start(async (index, blockNumber, progress) => {
    startBlock = blockNumber;

    onProgress(index, blockNumber, progress);
    SyncSource.set({ value: SyncSourceType.Indexer });
    SyncStatus.set({
      step: SyncStep.Syncing,
      progress,
      message: `Hydrating from Indexer`,
      lastBlockNumberProcessed: blockNumber,
    });

    if (progress === 1) {
      // This will hydrate remaining blocks from RPC
      onComplete(startBlock);
    }
  }, onError);
};

export const hydrateFromRpc = (
  components: ReturnType<typeof createLocalSyncTables>,
  sync: SyncType,
  onSync: OnSyncCallbacks,
) => {
  const { SyncStatus, SyncSource } = components;
  const { progress: onProgress, complete: onComplete, error: onError } = onSync;

  sync.start(
    (index, blockNumber, progress) => {
      SyncSource.set({ value: SyncSourceType.RPC });
      SyncStatus.set({
        step: SyncStep.Syncing,
        message: "Hydrating from RPC",
        progress,
        lastBlockNumberProcessed: blockNumber,
      });
      onProgress(index, blockNumber, progress);

      if (progress === 1) {
        SyncStatus.set({
          step: SyncStep.Complete,
          message: "DONE",
          progress: 1,
          lastBlockNumberProcessed: blockNumber,
        });
        onComplete(blockNumber);
      }
    },
    (err: unknown) => {
      onError(err);
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

export const subToRpc = (components: ReturnType<typeof createLocalSyncTables>, sync: SyncType) => {
  const { SyncStatus } = components;
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
