import { Read } from "../../read";
import { createSync } from "./customSync";
import { Write } from "../../write";
import {
  ReaderFilterIndexerParams,
  ReaderFilterRpcParams,
  ReaderQueryDecodedIndexerParams,
  ReaderSubscribeRpcParams,
  WriterRecsParams,
} from "../../types";

export function liveRPCRecsSync(args: ReaderSubscribeRpcParams & WriterRecsParams) {
  const { world, tables, address, logFilter, publicClient } = args;

  return createSync({
    reader: Read.fromRPC.subscribe({
      address: address,
      publicClient: publicClient,
      logFilter: logFilter,
    }),
    writer: Write.toRecs({ world, tables }),
  });
}

export function RPCRecsSync(args: ReaderFilterRpcParams & WriterRecsParams) {
  const { world, tables, address, filter, publicClient, fromBlock, toBlock, maxBlockRange, maxRetryCount } = args;

  return createSync({
    reader: Read.fromRPC.filter({
      address: address,
      publicClient: publicClient,
      filter,
      fromBlock,
      toBlock,
      maxBlockRange,
      maxRetryCount,
    }),
    writer: Write.toRecs({ world, tables }),
  });
}

export function filterIndexerRecsSync(args: WriterRecsParams & ReaderFilterIndexerParams) {
  const { world, tables, filter, indexerUrl } = args;

  return createSync({
    reader: Read.fromIndexer.filter({
      filter: filter,
      indexerUrl,
    }),
    writer: Write.toRecs({ world, tables }),
  });
}

export const queryDecodedIndexerRecsSync = (args: WriterRecsParams & ReaderQueryDecodedIndexerParams) => {
  const { world, tables, indexerUrl, query } = args;

  return createSync({
    reader: Read.fromDecodedIndexer.query({
      indexerUrl,
      query,
    }),
    writer: Write.toRecs({ world, tables }),
  });
};
