import { Store as StoreConfig } from "@latticexyz/store";
import { Schema } from "@latticexyz/recs";
import { Tables } from "@latticexyz/store/internal";

import { Components, NetworkConfig, OnSyncCallbacks, Sync as SyncType } from "@/types";
import { SyncSourceType, SyncStep } from "@/constants";

export type HandleSync<S extends Schema, config extends StoreConfig, tables extends Tables> = (
  components: Components<S, config, tables>,
  networkConfig: NetworkConfig,
  sync: SyncType,
  onSync: OnSyncCallbacks,
) => void;

export const hydrateFromIndexer: HandleSync<Schema, StoreConfig, Tables> = (
  components,
  networkConfig,
  sync,
  onSync,
) => {
  const { SyncStatus } = components;
  const { progress: onProgress, complete: onComplete, error: onError } = onSync;

  let startBlock = networkConfig.initialBlockNumber;

  sync.start(async (index, blockNumber, progress) => {
    startBlock = blockNumber;

    onProgress(index, blockNumber, progress);
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

export const hydrateFromRpc: HandleSync<Schema, StoreConfig, Tables> = (components, networkConfig, sync, onSync) => {
  const { SyncStatus, SyncSource } = components;
  const { progress: onProgress, complete: onComplete, error: onError } = onSync;

  sync.start(
    (index, blockNumber, progress) => {
      SyncStatus.set({
        step: SyncStep.Syncing,
        message: "Hydrating from RPC",
        progress,
        lastBlockNumberProcessed: blockNumber,
      });
      SyncSource.set({ source: SyncSourceType.RPC });
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

export const subToRpc: HandleSync<Schema, StoreConfig, Tables> = (components, _, sync) => {
  const { SyncStatus } = components;
  sync.start(
    (_, blockNumber) => {
      if (blockNumber === BigInt(0)) return;

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
