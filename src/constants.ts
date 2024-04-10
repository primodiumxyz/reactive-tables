import { Tables } from "@latticexyz/store/internal";
import { keccak256, toHex } from "viem";

export enum SyncSourceType {
  Indexer,
  RPC,
}

export enum SyncStep {
  Syncing,
  Error,
  Complete,
}

export const internalTables: Tables = {
  SyncSource: {
    tableId: keccak256(toHex("SyncSource")),
    namespace: "sync",
    name: "SyncSource",
    keySchema: {},
    valueSchema: {
      source: { type: "uint32" }, // => Number, see SyncSourceType
    },
  },
  SyncStatus: {
    tableId: keccak256(toHex("SyncStatus")),
    namespace: "sync",
    name: "SyncStatus",
    keySchema: {},
    valueSchema: {
      step: { type: "uint32" }, // => Number, see SyncStep
      message: { type: "string" },
      progress: { type: "uint32" }, // 0 -> 1
    },
  },
};
