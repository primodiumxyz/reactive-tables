import { Store as StoreConfig } from "@latticexyz/store";
import { Schema } from "@latticexyz/recs";
import { Tables } from "@latticexyz/store/internal";

import { Components, NetworkConfig, OnSyncCallbacks, Sync } from "@/types";
import { SyncSourceType, SyncStep } from "@/constants";

export type HandleSync<S extends Schema, config extends StoreConfig, tables extends Tables> = (
  components: Components<S, config, tables>,
  sync: Sync,
  onSync: OnSyncCallbacks,
) => void;

export const handleSync: HandleSync<Schema, StoreConfig, Tables> = (components, sync, onSync) => {
  // TODO: TEMP: use only RPC for now (testing)
  // Hydrate
  hydrateFromRpc(components, sync, {
    ...onSync,
    complete: () => {
      onSync.complete();
      // Sub
      subToRpc(components, sync, onSync);
    },
  });

  const unsubscribe = () => Object.values(sync).forEach((syncType) => syncType.unsubscribe());
  return unsubscribe;
};

export const hydrateFromRpc: HandleSync<Schema, StoreConfig, Tables> = (components, sync, onSync) => {
  const { SyncStatus, SyncSource } = components;
  const { progress: onProgress, complete: onComplete, error: onError } = onSync;

  sync.historical.start(
    (index, blockNumber, progress) => {
      SyncStatus.set({ step: SyncStep.Syncing, message: "Hydrating from RPC", progress });
      SyncSource.set({ source: SyncSourceType.RPC });
      onProgress(index, blockNumber, progress);

      if (progress === 1) {
        SyncStatus.set({ step: SyncStep.Complete, message: "DONE", progress: 1 });
        onComplete();
      }
    },
    (err: unknown) => {
      onError(err);
      SyncStatus.set({ step: SyncStep.Error, message: "Failed to hydrate from RPC", progress: 0 });
      console.warn("Failed to hydrate from RPC", err);
    },
  );
};

export const subToRpc: HandleSync<Schema, StoreConfig, Tables> = (_, sync, onSync) => {
  // TODO: maybe extend SyncStatus & callbacks to differenciate live sub and still return some utilities?
  sync.live.start((_, blockNumber) => {
    console.log("Syncing updates on block:", blockNumber.toString());
  }, onSync.error);
};
