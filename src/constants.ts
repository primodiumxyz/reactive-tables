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

export const encodedDataKeys = ["__staticData", "__encodedLengths", "__dynamicData", "__lastSyncedAtBlock"];
export const internalKeys = ["__lastSyncedAtBlock"];
