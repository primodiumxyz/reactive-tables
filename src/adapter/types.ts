import type { StoreEventsAbiItem, StoreEventsAbi } from "@latticexyz/store";
import type { UnionPick } from "@latticexyz/common/type-utils";
import type { Log } from "viem";
import { BlockLogs } from "@primodiumxyz/sync-stack/types";

type StoreEventsLog = Log<bigint, number, false, StoreEventsAbiItem, true, StoreEventsAbi>;
export type StorageAdapterLog = Partial<StoreEventsLog> & UnionPick<StoreEventsLog, "address" | "eventName" | "args">;
export type StorageAdapterBlock = { blockNumber: BlockLogs["blockNumber"]; logs: readonly StorageAdapterLog[] };

export type StorageAdapter = (log: StorageAdapterLog) => void;
