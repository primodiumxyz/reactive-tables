import { z } from "zod";
import { querySchema, dbQuerySchema, filterSchema } from "../../pg-indexer-reader/src/postgres/querySchema";
import { Hex, Log, PublicClient } from "viem";
import { StoreEventsAbi, StoreEventsAbiItem, Table } from "@latticexyz/store";
import { FetchLogsOptions } from "@latticexyz/block-logs-stream";
import { World } from "@latticexyz/recs";
import { UnionPick } from "@latticexyz/common/type-utils";

export type Query = z.infer<typeof querySchema>;

export type DecodedIndexerQuery = z.input<typeof dbQuerySchema>;

export type LogFilter = z.input<typeof filterSchema>;

export type FetchAndFilterLogsOptions = Omit<FetchLogsOptions<StoreEventsAbi>, "events"> & {
  logFilter?: LogFilter["filters"];
};

export type ReaderSubscribeRpcParams = {
  publicClient: PublicClient;
  address: Hex;
  logFilter?: LogFilter["filters"];
};

export type Reader = {
  subscribe: (
    callback: (block: StorageAdapterBlock & { progress?: number }) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    errorCallback?: (err: any) => void
  ) => () => void;
};

export type ReaderFilterIndexerParams = {
  indexerUrl: string;
  filter: LogFilter;
};

export type ReaderQueryDecodedIndexerParams = {
  indexerUrl: string;
  query: DecodedIndexerQuery;
};

export type ReaderFilterRpcParams = Omit<FetchLogsOptions<StoreEventsAbi>, "events"> & {
  filter?: LogFilter;
};

export type Writer = (log: StorageAdapterLog) => void;

export type WriterRecsParams = {
  world: World;
  tables: Record<string, Table>;
  overwrite?: boolean;
};

export type WriterAdapterFunctions = {
  set: (log: StorageAdapterLog & { eventName: "Store_SetRecord" }) => void;
  updateStatic: (log: StorageAdapterLog & { eventName: "Store_SpliceStaticData" }) => void;
  updateDynamic: (log: StorageAdapterLog & { eventName: "Store_SpliceDynamicData" }) => void;
  delete: (log: StorageAdapterLog & { eventName: "Store_DeleteRecord" }) => void;
};

export type SyncOptions = {
  reader: Reader | Reader[];
  writer: Writer | Writer[];
};

export type Sync = {
  start: (
    onProgress?: (index: number, blockNumber: bigint, progress: number) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error?: (err: any) => void
  ) => void;
  unsubscribe: () => void;
};

export type TableNamespace = string;
export type TableName = string;

export type StoreEventsLog = Log<bigint, number, false, StoreEventsAbiItem, true, StoreEventsAbi>;
export type BlockLogs = { blockNumber: StoreEventsLog["blockNumber"]; logs: readonly StoreEventsLog[] };
export type StorageAdapterLog = Partial<StoreEventsLog> & UnionPick<StoreEventsLog, "address" | "eventName" | "args">;
export type StorageAdapterBlock = { blockNumber: BlockLogs["blockNumber"]; logs: readonly StorageAdapterLog[] };
