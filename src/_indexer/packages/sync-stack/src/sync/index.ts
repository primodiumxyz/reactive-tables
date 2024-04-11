import * as sync from "./factories";

export const Sync = {
  withCustom: sync.createSync,
  withLiveRPCRecsSync: sync.liveRPCRecsSync,
  withRPCRecsSync: sync.RPCRecsSync,
  withFilterIndexerRecsSync: sync.filterIndexerRecsSync,
  withQueryDecodedIndexerRecsSync: sync.queryDecodedIndexerRecsSync,
};
